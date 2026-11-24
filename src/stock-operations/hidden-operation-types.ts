import { type StockOperationType } from '../core/api/types/stockOperation/StockOperationType';

/**
 * Leaves out the operation types whose code (`operationType`, e.g. "requisition") is in the site's
 * `hiddenOperationTypes`. Only for what a user can start or filter by: existing operations of a hidden type
 * stay listed and open, so do not use it on lists of operations or to look up an operation's own type.
 */
export function withoutHiddenOperationTypes<T extends Pick<StockOperationType, 'operationType'>>(
  operationTypes: Array<T> | undefined,
  hiddenOperationTypes: Array<string> | undefined,
): Array<T> {
  const hidden = new Set((hiddenOperationTypes ?? []).map((code) => code.trim().toLowerCase()));
  return (operationTypes ?? []).filter((type) => !hidden.has((type.operationType ?? '').trim().toLowerCase()));
}
