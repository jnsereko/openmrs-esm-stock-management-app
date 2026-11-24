import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import { useConfig } from '@openmrs/esm-framework';
import { type StockOperationType } from '../core/api/types/stockOperation/StockOperationType';
import { StockFilters } from '../constants';
import { getStockOperationTypes } from '../stock-lookups/stock-lookups.resource';
import useFilteredOperationTypesByRoles from './stock-operations-forms/hooks/useFilteredOperationTypesByRoles';
import { withoutHiddenOperationTypes } from './hidden-operation-types';
import StockOperationTypesSelector from './stock-operation-types-selector/stock-operation-types-selector.component';
import StockOperationsFilters from './stock-operations-filters.component';

vi.mock('./stock-operations-forms/hooks/useFilteredOperationTypesByRoles', () => ({ default: vi.fn() }));
vi.mock('./stock-operation.utils', () => ({ launchStockoperationAddOrEditWorkSpace: vi.fn() }));
vi.mock('../stock-lookups/stock-lookups.resource', () => ({
  getStockOperationTypes: vi.fn(),
  useConcept: () => ({ items: { answers: [] }, isLoading: false }),
}));

const type = (uuid: string, name: string, operationType: string) =>
  ({ uuid, name, operationType } as unknown as StockOperationType);

const types = [
  type('t-receipt', 'Receipt', 'receipt'),
  type('t-requisition', 'Requisition', 'requisition'),
  type('t-issue', 'Stock Issue', 'stockissue'),
];

describe('withoutHiddenOperationTypes', () => {
  it('keeps every type when nothing is hidden', () => {
    expect(withoutHiddenOperationTypes(types, [])).toEqual(types);
    expect(withoutHiddenOperationTypes(types, undefined)).toEqual(types);
  });

  it('leaves out the types whose code is hidden, whatever its case', () => {
    const kept = withoutHiddenOperationTypes(types, [' Requisition ']);
    expect(kept.map((t) => t.uuid)).toEqual(['t-receipt', 't-issue']);
  });

  it('copes with no types', () => {
    expect(withoutHiddenOperationTypes(undefined, ['requisition'])).toEqual([]);
  });
});

describe('hidden operation types in the UI', () => {
  beforeEach(() => {
    vi.mocked(useFilteredOperationTypesByRoles).mockReturnValue({
      operationTypes: types,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useFilteredOperationTypesByRoles>);
    vi.mocked(getStockOperationTypes).mockResolvedValue({
      data: { results: types },
    } as unknown as Awaited<ReturnType<typeof getStockOperationTypes>>);
  });

  it('« Start New » still offers requisition when nothing is hidden', async () => {
    vi.mocked(useConfig).mockReturnValue({ hiddenOperationTypes: [] });
    render(<StockOperationTypesSelector />);
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Requisition')).toBeInTheDocument();
  });

  it('« Start New » does not offer a hidden type but offers the others', async () => {
    vi.mocked(useConfig).mockReturnValue({ hiddenOperationTypes: ['requisition'] });
    render(<StockOperationTypesSelector />);
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Receipt')).toBeInTheDocument();
    expect(screen.getByText('Stock Issue')).toBeInTheDocument();
    expect(screen.queryByText('Requisition')).not.toBeInTheDocument();
  });

  it('the Operation filter does not list a hidden type but lists the others', async () => {
    vi.mocked(useConfig).mockReturnValue({ hiddenOperationTypes: ['requisition'] });
    render(<StockOperationsFilters filterName={StockFilters.OPERATION} onFilterChange={vi.fn()} />);
    await waitFor(() => expect(screen.getByRole('combobox')).toBeEnabled());
    await userEvent.click(screen.getByRole('combobox'));
    expect(screen.getByText('Receipt')).toBeInTheDocument();
    expect(screen.getByText('Stock Issue')).toBeInTheDocument();
    expect(screen.queryByText('Requisition')).not.toBeInTheDocument();
  });
});
