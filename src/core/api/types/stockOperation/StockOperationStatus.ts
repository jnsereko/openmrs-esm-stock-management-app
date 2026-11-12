export const StockOperationStatusSubmitted = 'SUBMITTED';
export const StockOperationStatusNew = 'NEW';
export const StockOperationStatusReturned = 'RETURNED';
export const StockOperationStatusCancelled = 'CANCELLED';
export const StockOperationStatusDispatched = 'DISPATCHED';
export const StockOperationStatusCompleted = 'COMPLETED';
export const StockOperationStatusRejected = 'REJECTED';
// Set by the stock module when a requisition is approved
export const StockOperationStatusAuthorized = 'AUTHORIZED';

export const StockOperationStatusTypes = [
  StockOperationStatusNew,
  StockOperationStatusSubmitted,
  StockOperationStatusAuthorized,
  StockOperationStatusDispatched,
  StockOperationStatusCompleted,
  StockOperationStatusReturned,
  StockOperationStatusCancelled,
  StockOperationStatusRejected,
] as const;
export type StockOperationStatus = (typeof StockOperationStatusTypes)[number];
