import { ResourceRepresentation } from '../../../core/api/api';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import {
  type StockItemInventoryFilter,
  useStockItemInventory,
  useStockItemTransactions,
} from '../../stock-items.resource';

/**
 * The server bounds of a period picked as calendar days: local midnight to the last millisecond of the
 * end day, as ISO instants, so choosing 24/11 to 24/11 covers that local day whatever the server's timezone.
 * The server compares `dateCreated >= dateMin` and `dateCreated <= dateMax`.
 */
export const toTransactionPeriod = (from?: Date | null, to?: Date | null) => ({
  dateMin: from ? dayjs(from).startOf('day').toISOString() : null,
  dateMax: to ? dayjs(to).endOf('day').toISOString() : null,
});

export function useStockItemsTransactions(filter?: StockItemInventoryFilter) {
  const { t } = useTranslation();
  const [stockItemFilter, setStockItemFilter] = useState<StockItemInventoryFilter>({
    startIndex: 0,
    v: filter?.v || ResourceRepresentation.Default,
    limit: 10,
    q: filter?.q,
    totalCount: true,
  });

  const pageSizes = [10, 20, 30, 40, 50];
  const [currentPageSize, setPageSize] = useState(10);
  const [searchString, setSearchString] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);

  const [stockItemUuid, setStockItemUuid] = useState<string | null>(filter?.stockItemUuid);
  const [partyUuid, setPartyUuid] = useState<string | null>(filter?.partyUuid);
  const [locationUuid, setLocationUuid] = useState<string | null>(filter?.locationUuid);
  const [stockBatchUuid, setStockBatchUuid] = useState<string | null>(filter?.stockBatchUuid);
  const [dateMin, setDateMin] = useState<string | null>(null);
  const [dateMax, setDateMax] = useState<string | null>(null);

  // A new filter shows its first page
  const setLocationFilter = useCallback((uuid: string | null) => {
    setLocationUuid(uuid);
    setCurrentPage(1);
  }, []);
  const setPeriod = useCallback((from?: Date | null, to?: Date | null) => {
    const period = toTransactionPeriod(from, to);
    setDateMin(period.dateMin);
    setDateMax(period.dateMax);
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    setStockItemFilter({
      startIndex: currentPage - 1,
      v: ResourceRepresentation.Default,
      limit: currentPageSize,
      q: searchString,
      totalCount: true,
      stockItemUuid: stockItemUuid,
      partyUuid: partyUuid,
      locationUuid: locationUuid,
      stockBatchUuid: stockBatchUuid,
      dateMin,
      dateMax,
    });
  }, [
    searchString,
    currentPage,
    currentPageSize,
    stockItemUuid,
    partyUuid,
    locationUuid,
    stockBatchUuid,
    dateMin,
    dateMax,
  ]);

  const { items, isLoading, error } = useStockItemTransactions(stockItemFilter);
  // The balance is the item's stock now: the period does not apply to it
  const inventoryFilter = useMemo(() => ({ ...stockItemFilter, dateMin: null, dateMax: null }), [stockItemFilter]);
  const { items: inventory } = useStockItemInventory(inventoryFilter);

  const tableHeaders = useMemo(
    () => [
      {
        key: 'date',
        header: t('date', 'Date'),
      },
      {
        key: 'location',
        header: t('location', 'Location'),
      },
      {
        key: 'transaction',
        header: t('transaction', 'Transaction'),
      },
      {
        key: 'in',
        header: t('transactionIn', 'IN'),
      },
      {
        key: 'out',
        header: t('transactionOut', 'OUT'),
      },
      {
        key: 'batch',
        header: t('batch', 'Batch No'),
      },
      {
        key: 'reference',
        header: t('reference', 'Reference'),
      },
      {
        key: 'status',
        header: t('status', 'Status'),
      },
    ],
    [t],
  );

  const binCardHeaders = useMemo(
    () => [
      {
        key: 'date',
        header: t('date', 'Date'),
      },
      {
        key: 'location',
        header: t('location', 'Location'),
      },
      {
        key: 'transaction',
        header: t('transaction', 'Transaction'),
      },
      {
        key: 'totalin',
        header: t('transactionIn', 'IN'),
      },
      {
        key: 'totalout',
        header: t('transactionOut', 'OUT'),
      },
      {
        key: 'batch',
        header: t('batch', 'Batch No'),
      },
      {
        key: 'balance',
        header: t('balance', 'Balance'),
      },
      {
        key: 'reference',
        header: t('reference', 'Reference'),
      },
      {
        key: 'status',
        header: t('status', 'Status'),
      },
    ],
    [t],
  );

  return {
    items: items.results,
    totalCount: items.totalCount,
    currentPage,
    currentPageSize,
    setCurrentPage,
    setPageSize,
    pageSizes,
    isLoading,
    error,
    setSearchString,
    tableHeaders,
    setStockItemUuid,
    setLocationUuid: setLocationFilter,
    setPeriod,
    dateMin,
    dateMax,
    setPartyUuid,
    setStockBatchUuid,
    binCardHeaders,
    inventory: inventory,
  };
}
