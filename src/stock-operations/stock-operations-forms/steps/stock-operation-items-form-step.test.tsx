import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, within } from '@testing-library/react';
import { FormProvider, useForm, type Resolver, type UseFormReturn } from 'react-hook-form';
import { showSnackbar } from '@openmrs/esm-framework';
import { receiptOperationTypeMock, requisitionOperationTypeMock, stockIssueOperationtypeMock } from '@mocks';
import { type StockOperationType } from '../../../core/api/types/stockOperation/StockOperationType';
import { type StockOperationItemDtoSchema } from '../../validation-schema';
import StockOperationItemsFormStep from './stock-operation-items-form-step.component';

vi.mock('../input-components/stock-item-search.component', () => ({
  default: () => <div>stock item search</div>,
}));
vi.mock('./stock-operation-item-cell.component', () => ({
  default: ({ stockItemUuid }: { stockItemUuid: string }) => <span>{stockItemUuid}</span>,
}));
vi.mock('./stock-availability-cell.component', () => ({
  default: ({ partyUuid }) => <span>availability at {partyUuid}</span>,
}));
vi.mock('./quantity-uom-cell.component', () => ({ default: () => <span>uom</span> }));
vi.mock('./stock-operation-item-batch-no-cell.component', () => ({ default: () => <span>batch</span> }));
vi.mock('./stock-operation-item-expiry-cell.component', () => ({ default: () => <span>expiry</span> }));

const items = [
  { uuid: 'item-1-uuid', stockItemUuid: 'stock-item-a', quantity: 10, stockItemPackagingUOMUuid: 'uom-1' },
  { uuid: 'new-item-2', stockItemUuid: 'stock-item-b', quantity: 20, stockItemPackagingUOMUuid: 'uom-1' },
  { uuid: 'item-3-uuid', stockItemUuid: 'stock-item-c', quantity: 30, stockItemPackagingUOMUuid: 'uom-1' },
];

let formRef: UseFormReturn<StockOperationItemDtoSchema>;

// Like the operation's schema: at least one line
const atLeastOneItemResolver: Resolver<StockOperationItemDtoSchema> = async (values) =>
  values.stockOperationItems?.length
    ? { values, errors: {} }
    : {
        values: {},
        errors: { stockOperationItems: { type: 'too_small', message: 'You must add atleast one stock item' } },
      };

const Wrapper: React.FC<{
  onLaunchItemsForm: () => void;
  operationType?: unknown;
  readOnly?: boolean;
  initialItems?: typeof items;
  onNext?: () => void;
}> = ({ onLaunchItemsForm, operationType = requisitionOperationTypeMock, readOnly, initialItems = items, onNext }) => {
  const form = useForm<StockOperationItemDtoSchema>({
    resolver: atLeastOneItemResolver,
    defaultValues: {
      stockOperationItems: initialItems,
      sourceUuid: 'source-party',
      destinationUuid: 'destination-party',
    } as unknown as StockOperationItemDtoSchema,
  });
  formRef = form;
  return (
    <FormProvider {...form}>
      <StockOperationItemsFormStep
        stockOperationType={operationType as StockOperationType}
        onLaunchItemsForm={onLaunchItemsForm}
        readOnly={readOnly}
        onNext={onNext}
      />
    </FormProvider>
  );
};

const getRow = (stockItemUuid: string) =>
  screen.getAllByRole('row').find((row) => within(row).queryByText(stockItemUuid));

describe('StockOperationItemsFormStep', () => {
  it('removes only the clicked line when Delete is pressed', async () => {
    const user = userEvent.setup();
    const onLaunchItemsForm = vi.fn();
    render(<Wrapper onLaunchItemsForm={onLaunchItemsForm} />);

    expect(screen.getByText('stock-item-a')).toBeInTheDocument();
    expect(screen.getByText('stock-item-b')).toBeInTheDocument();
    expect(screen.getByText('stock-item-c')).toBeInTheDocument();

    await user.click(within(getRow('stock-item-b')).getByRole('button', { name: 'Delete' }));

    expect(screen.queryByText('stock-item-b')).not.toBeInTheDocument();
    expect(screen.getByText('stock-item-a')).toBeInTheDocument();
    expect(screen.getByText('stock-item-c')).toBeInTheDocument();
    expect(formRef.getValues('stockOperationItems').map((item) => item.uuid)).toEqual(['item-1-uuid', 'item-3-uuid']);
    expect(onLaunchItemsForm).not.toHaveBeenCalled();
  });

  it('opens the item form for the clicked line when Edit is pressed', async () => {
    const user = userEvent.setup();
    const onLaunchItemsForm = vi.fn();
    render(<Wrapper onLaunchItemsForm={onLaunchItemsForm} />);

    await user.click(within(getRow('stock-item-c')).getByRole('button', { name: 'Edit' }));

    expect(onLaunchItemsForm).toHaveBeenCalledTimes(1);
    expect(onLaunchItemsForm).toHaveBeenCalledWith(expect.objectContaining({ uuid: 'item-3-uuid' }));
    expect(formRef.getValues('stockOperationItems')).toHaveLength(3);
  });

  it("shows availability at the operation's source location, or at its destination for a receipt", () => {
    const { unmount } = render(<Wrapper onLaunchItemsForm={vi.fn()} operationType={stockIssueOperationtypeMock} />);
    expect(screen.getAllByText('availability at source-party')).toHaveLength(3);
    unmount();

    render(<Wrapper onLaunchItemsForm={vi.fn()} operationType={receiptOperationTypeMock} />);
    expect(screen.getAllByText('availability at destination-party')).toHaveLength(3);
  });

  // #634: a completed operation opened with edit and delete buttons
  it('offers no item search, edit or delete when the operation can no longer be changed', () => {
    render(<Wrapper onLaunchItemsForm={vi.fn()} readOnly />);

    expect(screen.getByText('stock-item-a')).toBeInTheDocument();
    expect(screen.queryByText('stock item search')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Delete')).not.toBeInTheDocument();
    expect(screen.queryByText('Actions')).not.toBeInTheDocument();
  });

  // #644: « Validation error / You must add atleast one item » was English, with a typo, and never closed
  it('shows a translated validation error that closes by itself when there is no line', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    render(<Wrapper onLaunchItemsForm={vi.fn()} initialItems={[]} onNext={onNext} />);

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(onNext).not.toHaveBeenCalled();
    expect(showSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'error',
        title: 'Validation error',
        subtitle: 'You must add at least one item',
        autoClose: true,
      }),
    );
  });
});
