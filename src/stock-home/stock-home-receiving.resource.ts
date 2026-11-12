import { type StockOperationFilter, useStockOperations } from '../stock-operations/stock-operations.resource';

const time = (date: Date | string | null | undefined) => (date ? new Date(date).getTime() : 0);

/**
 * Completed receipts, newest first: the stock that has actually come in. A draft, submitted or
 * cancelled receipt brought nothing into stock.
 */
export function useStockReceiving(filter: StockOperationFilter) {
  const { items, isLoading, error } = useStockOperations({ ...filter, status: 'COMPLETED' });

  const receivedItems = items?.results
    ?.filter((item) => item?.operationType === 'receipt' && item?.status === 'COMPLETED')
    .sort(
      (a, b) =>
        time(b.completedDate ?? b.operationDate ?? b.dateCreated) -
        time(a.completedDate ?? a.operationDate ?? a.dateCreated),
    );
  return {
    items: receivedItems,
    isLoading,
    error,
  };
}
