import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, render, renderHook, screen } from '@testing-library/react';
import {
  type StockItemInventoryFilter,
  useStockItemInventory,
  useStockItemTransactions,
} from '../../stock-items.resource';
import { toTransactionPeriod, useStockItemsTransactions } from './transactions.resource';
import Transactions from './transactions.component';

// Every text goes through t: shown as « t:key », an English literal shows as itself (#638)
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, _default?: string, options?: Record<string, unknown>) =>
      `t:${key}` +
      (options
        ? Object.entries(options)
            .filter(([name]) => name !== 'interpolation')
            .map(([name, value]) => `|${name}=${value}`)
            .join('')
        : ''),
  }),
}));
vi.mock('../../stock-items.resource', () => ({
  useStockItemTransactions: vi.fn(),
  useStockItemInventory: vi.fn(),
}));
vi.mock('../../../core/components/table/table.component', () => ({
  default: ({ columns, data }) => (
    <table>
      <tbody>
        <tr>
          {columns.map((column) => (
            <th key={column.key}>{column.header}</th>
          ))}
        </tr>
        {data.map((row) => (
          <tr key={row.id}>
            {columns.map((column) => (
              <td key={column.key}>{typeof row[column.key] === 'string' ? row[column.key] : null}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));
vi.mock('./printout/transactions-print-action.component', () => ({ default: () => null }));
vi.mock('./transaction-filters/transaction-locations-filter.component', () => ({ default: () => null }));
vi.mock('../../../stock-operations/stock-operation-reference.component', () => ({ default: () => null }));

const transaction = {
  uuid: 'tx-1',
  dateCreated: new Date(2026, 10, 13),
  partyName: 'Box 1',
  quantity: 7,
  packagingUomName: 'Comprimé',
  packagingUomFactor: 1,
  stockOperationTypeName: 'Stock Issue',
  stockOperationStatus: 'COMPLETED',
  isPatientTransaction: false,
};

const mockResources = (transactions = [transaction]) => {
  vi.mocked(useStockItemTransactions).mockReturnValue({
    items: { results: transactions, totalCount: transactions.length },
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof useStockItemTransactions>);
  vi.mocked(useStockItemInventory).mockReturnValue({ items: { total: 7 } } as unknown as ReturnType<
    typeof useStockItemInventory
  >);
};

describe('Stock item transactions', () => {
  it('translates the column headers', () => {
    mockResources();
    const { result } = renderHook(() => useStockItemsTransactions({ stockItemUuid: 'item-uuid' }));

    for (const headers of [result.current.tableHeaders, result.current.binCardHeaders]) {
      expect(headers.every(({ header }) => header.startsWith('t:'))).toBe(true);
    }
  });

  it('translates quantities, statuses and patient dispenses', () => {
    mockResources([transaction, { ...transaction, uuid: 'tx-2', quantity: -3, isPatientTransaction: true }]);
    render(<Transactions stockItemUuid="item-uuid" />);

    expect(screen.getByText('t:transactionQuantity|quantity=7|unit=Comprimé|factor=1')).toBeInTheDocument();
    expect(screen.getByText('t:transactionQuantity|quantity=3|unit=Comprimé|factor=1')).toBeInTheDocument();
    expect(screen.getAllByText('t:completed')).toHaveLength(2);
    expect(screen.getByText('t:patientDispense')).toBeInTheDocument();
    expect(screen.queryByText(/ of 1/)).not.toBeInTheDocument();
  });

  it('bounds a period to whole local days, end day included', () => {
    const { dateMin, dateMax } = toTransactionPeriod(new Date(2026, 10, 24, 15, 30), new Date(2026, 10, 24, 9));
    expect(new Date(dateMin)).toEqual(new Date(2026, 10, 24, 0, 0, 0, 0));
    expect(new Date(dateMax)).toEqual(new Date(2026, 10, 24, 23, 59, 59, 999));
    expect(toTransactionPeriod(null, undefined)).toEqual({ dateMin: null, dateMax: null });
    expect(toTransactionPeriod(new Date(2026, 10, 24), null).dateMax).toBeNull();
  });

  it('sends the period to the server, back on page 1, and drops it when cleared', () => {
    mockResources();
    const { result } = renderHook(() => useStockItemsTransactions({ stockItemUuid: 'item-uuid' }));
    const lastFilter = () => vi.mocked(useStockItemTransactions).mock.calls.at(-1)[0] as StockItemInventoryFilter;

    act(() => result.current.setCurrentPage(3));
    expect(lastFilter().startIndex).toBe(2);

    act(() => result.current.setPeriod(new Date(2026, 10, 24), new Date(2026, 10, 25)));
    expect(lastFilter().startIndex).toBe(0);
    expect(new Date(lastFilter().dateMin)).toEqual(new Date(2026, 10, 24));
    expect(new Date(lastFilter().dateMax)).toEqual(new Date(2026, 10, 25, 23, 59, 59, 999));
    // The balance is the stock now: the period is not applied to it
    const inventoryFilter = vi.mocked(useStockItemInventory).mock.calls.at(-1)[0] as StockItemInventoryFilter;
    expect(inventoryFilter.dateMin).toBeNull();

    act(() => result.current.setCurrentPage(2));
    act(() => result.current.setLocationUuid('loc-1'));
    expect(lastFilter().startIndex).toBe(0);
    expect(lastFilter().locationUuid).toBe('loc-1');
    expect(lastFilter().dateMin).not.toBeNull();

    act(() => result.current.setPeriod(null, null));
    expect(lastFilter().dateMin).toBeNull();
    expect(lastFilter().dateMax).toBeNull();
  });
});
