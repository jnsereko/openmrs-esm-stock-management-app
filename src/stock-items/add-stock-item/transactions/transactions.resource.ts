import { openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';
import { ResourceRepresentation, toQueryParams } from '../../../core/api/api';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useParties } from '../../../stock-lookups/stock-lookups.resource';
import { type StockItemTransactionDTO } from '../../../core/api/types/stockItem/StockItemTransaction';
import { type Party } from '../../../core/api/types/Party';
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

/**
 * The transactions endpoint filters on `partyUuid` only: it ignores `locationUuid` (the inventory endpoint
 * resolves a location itself, this one does not). A stock location's party is the one carrying its uuid.
 * A location with no party matches nothing, so its own uuid is sent: the server finds no such party and
 * answers with an empty list rather than the unfiltered one.
 */
export const partyUuidForLocation = (parties: Array<Party> | undefined, locationUuid: string) =>
  parties?.find((party) => party.locationUuid === locationUuid)?.uuid ?? locationUuid;

/**
 * The server answers at most `webservices.rest.maxResultsAbsolute` rows (100 by default) and fails with
 * HTTP 500 above it, so a print asks for pages of at most this size
 */
export const PRINT_PAGE_SIZE = 100;

/** The most movements one print collects; a longer list is cut and the print says so */
export const PRINT_MAX_ROWS = 2000;

/**
 * Every movement of the filtered list (not one page), for the printed cards: pages of `PRINT_PAGE_SIZE`
 * (the transactions endpoint takes `startIndex` as a page number) until the server's total, a short page
 * or `PRINT_MAX_ROWS`. `truncated` is true when more rows exist than were collected.
 */
export async function fetchPrintTransactions(filter: StockItemInventoryFilter) {
  const rows: Array<StockItemTransactionDTO> = [];
  let total: number | null = null;
  for (let page = 0; ; page++) {
    // The total is asked once, with the first page
    const query = toQueryParams({ ...filter, startIndex: page, limit: PRINT_PAGE_SIZE, totalCount: page === 0 });
    const response = await openmrsFetch(`${restBaseUrl}/stockmanagement/stockitemtransaction${query}`);
    const results = (response?.data?.results ?? []) as Array<StockItemTransactionDTO>;
    if (page === 0 && typeof response?.data?.totalCount === 'number') {
      total = response.data.totalCount;
    }
    rows.push(...results);
    const exhausted = results.length < PRINT_PAGE_SIZE || (total !== null && rows.length >= total);
    if (exhausted) {
      return { rows, truncated: false };
    }
    if (rows.length >= PRINT_MAX_ROWS) {
      return { rows: rows.slice(0, PRINT_MAX_ROWS), truncated: true };
    }
  }
}

/** A day typed in a date picker box as DD/MM/YYYY; null when empty or not a real date */
export const parseTypedDate = (value?: string | null): Date | null => {
  const match = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/.exec(value ?? '');
  if (!match) {
    return null;
  }
  const [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
};

export function useStockItemsTransactions(filter?: StockItemInventoryFilter) {
  const { t } = useTranslation();
  // The first request already carries the item and period it is opened with (the Rapports view opens on a month)
  const [stockItemFilter, setStockItemFilter] = useState<StockItemInventoryFilter>({
    startIndex: 0,
    v: filter?.v || ResourceRepresentation.Default,
    limit: 10,
    q: filter?.q,
    totalCount: true,
    stockItemUuid: filter?.stockItemUuid,
    dateMin: filter?.dateMin ?? null,
    dateMax: filter?.dateMax ?? null,
  });

  const pageSizes = [10, 20, 30, 40, 50];
  const [currentPageSize, setPageSize] = useState(10);
  const [searchString, setSearchString] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const { items: parties } = useParties();

  const [stockItemUuid, setStockItemUuid] = useState<string | null>(filter?.stockItemUuid);
  const [partyUuid, setPartyUuid] = useState<string | null>(filter?.partyUuid);
  const [locationUuid, setLocationUuid] = useState<string | null>(filter?.locationUuid);
  const [stockBatchUuid, setStockBatchUuid] = useState<string | null>(filter?.stockBatchUuid);
  const [dateMin, setDateMin] = useState<string | null>(filter?.dateMin ?? null);
  const [dateMax, setDateMax] = useState<string | null>(filter?.dateMax ?? null);

  // A new filter shows its first page
  const setLocationFilter = useCallback((uuid: string | null) => {
    setLocationUuid(uuid);
    setCurrentPage(1);
  }, []);
  // A new page size shows its first page, refetched with the new limit
  const changePageSize = useCallback((size: number) => {
    setPageSize(size);
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

  const transactionFilter = useMemo(() => {
    const { locationUuid: location, ...rest } = stockItemFilter;
    return location ? { ...rest, partyUuid: partyUuidForLocation(parties?.results, location) } : rest;
  }, [stockItemFilter, parties]);
  const { items, isLoading, error } = useStockItemTransactions(transactionFilter);
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
    setPageSize: changePageSize,
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
    transactionFilter,
  };
}
