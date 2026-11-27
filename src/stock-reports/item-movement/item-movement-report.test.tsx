import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useConfig } from '@openmrs/esm-framework';
import {
  type StockItemInventoryFilter,
  useStockItemInventory,
  useStockItems,
  useStockItemTransactions,
} from '../../stock-items/stock-items.resource';
import { useParties } from '../../stock-lookups/stock-lookups.resource';
import { toQueryParams } from '../../core/api/api';
import ItemMovementReport, { currentMonthPeriod } from './item-movement-report.component';

vi.mock('../../stock-items/stock-items.resource', () => ({
  useStockItems: vi.fn(),
  useStockItemTransactions: vi.fn(),
  useStockItemInventory: vi.fn(),
}));
vi.mock('../../stock-lookups/stock-lookups.resource', () => ({
  useParties: vi.fn(),
  useStockTagLocations: () => ({ stockLocations: [{ id: 'loc-a', name: 'Pharmacie centrale' }] }),
}));
vi.mock('../../core/components/table/table.component', () => ({
  default: ({ children, data }) => (
    <div>
      {children?.()}
      <span data-testid="row-count">{data?.length ?? 0}</span>
    </div>
  ),
}));
vi.mock('../../stock-items/add-stock-item/transactions/printout/transactions-print-action.component', () => ({
  default: ({ itemUuid }) => <button type="button">print {itemUuid}</button>,
}));
vi.mock('../../stock-operations/stock-operation-reference.component', () => ({ default: () => null }));

const paracetamol = { uuid: 'item-para', drugName: 'Paracetamol 500mg', commonName: 'Paracétamol' };
const amoxicillin = { uuid: 'item-amox', drugName: 'Amoxicillin 250mg', commonName: null };

const lastTransactionsFilter = () =>
  vi.mocked(useStockItemTransactions).mock.calls.at(-1)[0] as StockItemInventoryFilter;

describe('Item movement report', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 27, 10, 0));
    vi.mocked(useConfig).mockReturnValue({ useItemCommonNameAsDisplay: true } as never);
    vi.mocked(useStockItems).mockReturnValue({
      items: { results: [paracetamol, amoxicillin] },
      isLoading: false,
      error: null,
    } as never);
    vi.mocked(useStockItemTransactions).mockReturnValue({
      items: { results: [], totalCount: 0 },
      isLoading: false,
      error: null,
    } as never);
    vi.mocked(useStockItemInventory).mockReturnValue({ items: { total: 0 } } as never);
    vi.mocked(useParties).mockReturnValue({
      items: { results: [{ uuid: 'party-a', locationUuid: 'loc-a', name: 'Pharmacie centrale' }] },
      isLoading: false,
      error: null,
    } as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens on the current month', () => {
    const { from, to } = currentMonthPeriod(new Date(2026, 10, 27, 10, 0));
    expect(from).toEqual(new Date(2026, 10, 1));
    expect(to).toEqual(new Date(2026, 10, 30));
  });

  it('asks for no movement before an item is chosen', () => {
    render(<ItemMovementReport />);
    expect(screen.getByText('Choose a stock item to see its movements.')).toBeInTheDocument();
    expect(useStockItemTransactions).not.toHaveBeenCalled();
  });

  it('lists the chosen item’s movements of the current month, all locations, in pages the server accepts', async () => {
    const user = userEvent.setup();
    render(<ItemMovementReport />);

    await user.type(screen.getByRole('searchbox'), 'para');
    await user.click(screen.getByText('Paracétamol'));

    expect(screen.getByTestId('item-movement-item')).toHaveTextContent('Paracétamol (Paracetamol 500mg)');
    // Every request for the list is of that item: none goes out unfiltered while the view mounts
    const filters = vi.mocked(useStockItemTransactions).mock.calls.map((call) => call[0] as StockItemInventoryFilter);
    expect(filters.length).toBeGreaterThan(0);
    filters.forEach((filter) => {
      expect(filter.stockItemUuid).toBe('item-para');
      expect(filter.limit).toBeLessThanOrEqual(100);
    });
    const filter = lastTransactionsFilter();
    expect(new Date(filter.dateMin)).toEqual(new Date(2026, 10, 1));
    expect(new Date(filter.dateMax)).toEqual(new Date(2026, 10, 30, 23, 59, 59, 999));
    expect(filter.partyUuid).toBeUndefined();
    expect(toQueryParams(filter)).toMatch(/stockItemUuid=item-para.*dateMin=.*dateMax=/);
    // « All locations » shows in the location box
    expect(screen.getByRole('combobox')).toHaveValue('All locations');
    expect(screen.getByRole('button', { name: 'print item-para' })).toBeInTheDocument();
  });

  it('sends the chosen location as its stock party, keeping item and period', async () => {
    const user = userEvent.setup();
    render(<ItemMovementReport />);
    await user.type(screen.getByRole('searchbox'), 'para');
    await user.click(screen.getByText('Paracétamol'));

    await user.clear(screen.getByRole('combobox'));
    await user.type(screen.getByRole('combobox'), 'Pharm');
    await user.click(await screen.findByRole('option', { name: 'Pharmacie centrale' }));

    await waitFor(() => expect(lastTransactionsFilter().partyUuid).toBe('party-a'));
    const filter = lastTransactionsFilter();
    expect(filter.stockItemUuid).toBe('item-para');
    expect(filter.dateMin).not.toBeNull();
    expect(filter.dateMax).not.toBeNull();
    expect(filter.limit).toBeLessThanOrEqual(100);
  });

  it('switches to another item', async () => {
    const user = userEvent.setup();
    render(<ItemMovementReport />);
    await user.type(screen.getByRole('searchbox'), 'para');
    await user.click(screen.getByText('Paracétamol'));
    await user.type(screen.getByRole('searchbox'), 'amox');
    await user.click(screen.getByText(/Amoxicillin 250mg/));

    expect(screen.getByTestId('item-movement-item')).toHaveTextContent('Amoxicillin 250mg');
    expect(lastTransactionsFilter().stockItemUuid).toBe('item-amox');
  });

  it('goes back to the reports list', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ItemMovementReport onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Back to reports' }));
    expect(onClose).toHaveBeenCalled();
  });
});
