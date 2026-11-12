import { useEffect } from 'react';
import { launchWorkspace2, openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';
import { STOCK_ITEM_URL_PARAM } from '../constants';
import { type StockItemDTO } from '../core/api/types/stockItem/StockItem';

export const launchAddOrEditStockItemWorkspace = (stockItem?: StockItemDTO) => {
  launchWorkspace2('stock-item-form-workspace', { stockItem });
};

/**
 * Opens the stock item named by the page URL's `stockItem` (the item links of an operation's items),
 * as clicking its name in the list does, then drops it from the URL so a reload does not reopen it.
 */
export const useOpenStockItemFromUrl = () => {
  useEffect(() => {
    const url = new URL(window.location.href);
    const stockItemUuid = url.searchParams.get(STOCK_ITEM_URL_PARAM);
    if (!stockItemUuid) {
      return;
    }
    url.searchParams.delete(STOCK_ITEM_URL_PARAM);
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
    openmrsFetch<StockItemDTO>(`${restBaseUrl}/stockmanagement/stockitem/${encodeURIComponent(stockItemUuid)}?v=full`)
      .then(({ data }) => {
        if (data?.uuid) {
          launchAddOrEditStockItemWorkspace({ ...data, isDrug: !!data.drugUuid });
        }
      })
      .catch(() => {
        // An unknown or unreadable item leaves the list as it is
      });
  }, []);
};
