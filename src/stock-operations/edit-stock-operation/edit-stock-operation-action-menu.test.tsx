import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { type StockOperationDTO } from '../../core/api/types/stockOperation/StockOperationDTO';
import { useStockOperationAndItems } from '../stock-operations.resource';
import EditStockOperationActionMenu from './edit-stock-operation-action-menu.component';

vi.mock('../stock-operations.resource', () => ({ useStockOperationAndItems: vi.fn() }));
vi.mock('../stock-operations-forms/hooks/useFilteredOperationTypesByRoles', () => ({
  default: () => ({ operationTypes: [], isLoading: false, error: null }),
}));

const operation = (status: string, canEdit = true) =>
  ({
    uuid: 'op-uuid',
    operationNumber: 'SIS-0058',
    status,
    permission: { canEdit },
  } as unknown as StockOperationDTO);

const renderRowButton = (stockOperation: StockOperationDTO) => {
  vi.mocked(useStockOperationAndItems).mockReturnValue({
    items: stockOperation,
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof useStockOperationAndItems>);
  return render(<EditStockOperationActionMenu stockOperation={stockOperation} showIcon showprops={false} />);
};

describe('EditStockOperationActionMenu', () => {
  // #638: the row pencil said « Modifier » on a completed operation, which opens as « Voir »
  it('is labelled View for an operation that can no longer be changed', () => {
    renderRowButton(operation('COMPLETED'));

    expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('is labelled Edit for a new operation the user may change', () => {
    renderRowButton(operation('NEW'));

    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('is labelled View for a new operation the user may not change', () => {
    renderRowButton(operation('NEW', false));

    expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument();
  });
});
