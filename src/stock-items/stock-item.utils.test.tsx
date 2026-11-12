import { describe, expect, it, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { launchWorkspace2, openmrsFetch } from '@openmrs/esm-framework';
import { URL_STOCK_ITEM } from '../constants';
import { useOpenStockItemFromUrl } from './stock-item.utils';

describe('stock item links', () => {
  afterEach(() => window.history.replaceState(null, '', '/'));

  // #638: an operation's item linked to /openmrs/spa/stock-items/<uuid>, a route the app does not have
  it("link to the app's Items page", () => {
    expect(URL_STOCK_ITEM('item-uuid')).toBe('/stock-management/items?stockItem=item-uuid');
  });

  it('open the linked item on the Items page, once', async () => {
    vi.mocked(openmrsFetch).mockResolvedValue({
      data: { uuid: 'item-uuid', drugUuid: 'drug-uuid', drugName: 'Paracetamol' },
    } as Awaited<ReturnType<typeof openmrsFetch>>);
    window.history.replaceState(null, '', '/openmrs/spa' + URL_STOCK_ITEM('item-uuid'));

    renderHook(() => useOpenStockItemFromUrl());

    await waitFor(() =>
      expect(launchWorkspace2).toHaveBeenCalledWith('stock-item-form-workspace', {
        stockItem: expect.objectContaining({ uuid: 'item-uuid', isDrug: true }),
      }),
    );
    expect(openmrsFetch).toHaveBeenCalledWith(expect.stringContaining('/stockmanagement/stockitem/item-uuid?v=full'));
    expect(window.location.pathname + window.location.search).toBe('/openmrs/spa/stock-management/items');
  });

  it('leave the Items page alone without a linked item', () => {
    window.history.replaceState(null, '', '/openmrs/spa/stock-management/items');

    renderHook(() => useOpenStockItemFromUrl());

    expect(openmrsFetch).not.toHaveBeenCalled();
    expect(launchWorkspace2).not.toHaveBeenCalled();
  });
});
