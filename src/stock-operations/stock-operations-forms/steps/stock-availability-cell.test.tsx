import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useStockItemInventory } from '../../../stock-items/stock-items.resource';
import StockAvailability from './stock-availability-cell.component';

vi.mock('../../../stock-items/stock-items.resource', () => ({ useStockItemInventory: vi.fn() }));

describe('StockAvailability', () => {
  it("shows the quantity at the operation's location, not the total of all locations", () => {
    vi.mocked(useStockItemInventory).mockReturnValue({
      items: { results: [{ partyUuid: 'box-1', quantity: 120, quantityUoM: 'Tablet' }] },
      isLoading: false,
      error: undefined,
    } as unknown as ReturnType<typeof useStockItemInventory>);

    render(<StockAvailability stockItemUuid="item-uuid" partyUuid="box-1" />);

    expect(useStockItemInventory).toHaveBeenCalledWith(
      expect.objectContaining({ stockItemUuid: 'item-uuid', partyUuid: 'box-1', groupBy: 'LocationStockItem' }),
    );
    expect(screen.getByText('Available: 120 Tablet')).toBeInTheDocument();
  });

  // « Disponible : 411 » for the location next to a chosen batch of 16 (#641)
  it('shows the quantity of the chosen batch at that location', () => {
    vi.mocked(useStockItemInventory).mockReturnValue({
      items: { results: [{ partyUuid: 'rx', stockBatchUuid: 'batch-1', quantity: 16, quantityUoM: 'Tablet' }] },
      isLoading: false,
      error: undefined,
    } as unknown as ReturnType<typeof useStockItemInventory>);

    render(<StockAvailability stockItemUuid="item-uuid" partyUuid="rx" stockBatchUuid="batch-1" />);

    expect(useStockItemInventory).toHaveBeenLastCalledWith(
      expect.objectContaining({
        stockItemUuid: 'item-uuid',
        partyUuid: 'rx',
        stockBatchUuid: 'batch-1',
        groupBy: 'LocationStockItemBatchNo',
      }),
    );
    expect(screen.getByText('Available: 16 Tablet')).toBeInTheDocument();
  });
});
