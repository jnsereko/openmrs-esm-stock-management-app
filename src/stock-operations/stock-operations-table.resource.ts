import { type StockOperationFilter, useStockOperations } from './stock-operations.resource';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * One page of operations, paged by the server. The list was fetched once (the server's first 50)
 * and paged in the browser, so the oldest operations never showed and the last page repeated the
 * one before it (#634). The server's `startIndex` is a page number, from 0.
 */
export function useStockOperationPages(filter: StockOperationFilter) {
  const pageSizes = [10, 20, 30, 40, 50];
  const [currentPageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // A new filter starts again from the first page
  const filterKey = JSON.stringify(filter);
  useEffect(() => {
    setCurrentPage(1);
  }, [filterKey, currentPageSize]);

  const { items, isLoading, error } = useStockOperations({
    ...filter,
    totalCount: true,
    startIndex: currentPage - 1,
    limit: currentPageSize,
  });
  const pageItems = useMemo(() => items?.results ?? [], [items]);

  const { t } = useTranslation();

  const tableHeaders = useMemo(
    () => [
      {
        id: 0,
        header: t('type', 'Type'),
        key: 'operationTypeName',
      },
      {
        id: 1,
        header: t('number', 'Number'),
        key: 'operationNumber',
      },
      {
        id: 2,
        header: t('stockOperationItemsTableHeader', 'Items'),
        key: 'stockOperationItems',
      },
      {
        id: 3,
        header: t('status', 'Status'),
        key: 'status',
      },
      {
        id: 4,
        header: t('location', 'Location'),
        key: 'location',
      },
      {
        id: 5,
        header: t('responsiblePerson', 'Responsible Person'),
        key: 'responsiblePerson',
      },
      {
        id: 6,
        header: t('date', 'Date'),
        key: 'operationDate',
      },
      // No empty « details » column: the body had a blank cell under the actions header and the edit
      // button under an extra one, which made the table 50 px wider than it needs to be
      { id: 7, key: 'actions', header: '', isSortable: false },
    ],
    [t],
  );

  return {
    items: pageItems,
    totalItems: items?.totalCount,
    currentPage,
    currentPageSize,
    paginatedItems: pageItems,
    goTo: setCurrentPage,
    pageSizes,
    isLoading,
    error,
    setPageSize,
    tableHeaders,
  };
}
