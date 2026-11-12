import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { type StockOperationDTO } from '../core/api/types/stockOperation/StockOperationDTO';
import { StockFilters } from '../constants';
import { useStockOperationPages } from './stock-operations-table.resource';
import StockOperations from './stock-operations-table.component';

vi.mock('../utils', () => ({ useHandleMutate: () => vi.fn() }));
vi.mock('./stock-operations-table.resource', () => ({ useStockOperationPages: vi.fn() }));
vi.mock('./edit-stock-operation/edit-stock-operation-action-menu.component', () => ({
  default: ({ stockOperation, showprops }) => (showprops ? <span>{stockOperation.operationNumber}</span> : null),
}));
vi.mock('./stock-operation-types-selector/stock-operation-types-selector.component', () => ({ default: () => null }));
vi.mock('./stock-operations-filters.component', () => ({
  default: ({ filterName, onFilterChange }) =>
    filterName === StockFilters.STATUS ? (
      <button onClick={() => onFilterChange(['AUTHORIZED'], filterName)}>filter authorized</button>
    ) : null,
}));
// Like the real expanded row, reads the operation's type
vi.mock('./add-stock-operation/stock-operations-expanded-row/stock-operation-expanded-row.component', () => ({
  default: ({ model }) => (
    <div>
      details of {model.operationNumber} ({model.operationTypeUuid})
    </div>
  ),
}));

const operation = (uuid: string, operationNumber: string, status: string) =>
  ({
    uuid,
    operationNumber,
    status,
    operationTypeUuid: 'requisition-type',
    operationTypeName: 'Requisition',
    stockOperationItems: [],
  } as unknown as StockOperationDTO);

const operations = [
  operation('op-1', 'REQ-0001', 'AUTHORIZED'),
  operation('op-2', 'REQ-0002', 'SUBMITTED'),
  operation('op-3', 'REQ-0003', 'SUBMITTED'),
];

const tableHeaders = [
  { id: 0, header: 'Type', key: 'operationTypeName' },
  { id: 1, header: 'Number', key: 'operationNumber' },
  { id: 2, header: 'Status', key: 'status' },
  { id: 3, key: 'actions', header: '', isSortable: false },
];

describe('StockOperations table', () => {
  it('does not crash when a filter removes the row that is open, and closes it', async () => {
    const user = userEvent.setup();
    vi.mocked(useStockOperationPages).mockImplementation(({ status }) => {
      const items = status ? operations.filter((o) => status.split(',').includes(o.status)) : operations;
      return {
        items,
        tableHeaders,
        currentPage: 1,
        pageSizes: [10],
        totalItems: items.length,
        goTo: vi.fn(),
        currentPageSize: 10,
        setPageSize: vi.fn(),
        isLoading: false,
      } as unknown as ReturnType<typeof useStockOperationPages>;
    });
    render(<StockOperations />);

    // Open the third operation: once filtered, the list has one operation only
    await user.click(screen.getAllByRole('button', { name: 'Expand current row' })[2]);
    expect(screen.getByText('details of REQ-0003 (requisition-type)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'filter authorized' }));

    expect(screen.getByText('REQ-0001')).toBeInTheDocument();
    expect(screen.queryByText('REQ-0003')).not.toBeInTheDocument();
    expect(screen.queryByText(/details of/)).not.toBeInTheDocument();
  });

  it('opens the row it was asked to, whatever its position', async () => {
    const user = userEvent.setup();
    vi.mocked(useStockOperationPages).mockReturnValue({
      items: operations,
      tableHeaders,
      currentPage: 1,
      pageSizes: [10],
      totalItems: operations.length,
      goTo: vi.fn(),
      currentPageSize: 10,
      setPageSize: vi.fn(),
      isLoading: false,
    } as unknown as ReturnType<typeof useStockOperationPages>);
    render(<StockOperations />);

    await user.click(screen.getAllByRole('button', { name: 'Expand current row' })[1]);

    expect(screen.getByText('details of REQ-0002 (requisition-type)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse current row' })).toBeInTheDocument();
  });
});
