import { launchWorkspace2, showModal } from '@openmrs/esm-framework';
import { useLocation } from 'react-router-dom';
import { type StockOperationDTO } from '../core/api/types/stockOperation/StockOperationDTO';
import { type StockOperationType } from '../core/api/types/stockOperation/StockOperationType';

export const launchStockoperationAddOrEditWorkSpace = (
  operationType: StockOperationType,
  stockOperation?: StockOperationDTO,
  stockRequisitionUuid?: string, // Only supplied on stock issue (when workspace is launched for stock issue)
) => {
  launchWorkspace2('stock-operation-form-workspace', {
    stockOperationType: operationType,
    stockOperation: stockOperation,
    stockRequisitionUuid: stockRequisitionUuid,
  });
};

/**
 * An operation can be changed only while it is new or returned (as the server checks); a submitted,
 * dispatched or completed one opens to be looked at, as « View » (#634, #638).
 */
export const isStockOperationEditable = (stockOperation?: StockOperationDTO | null) =>
  !stockOperation ||
  ((stockOperation.status === 'NEW' || stockOperation.status === 'RETURNED') &&
    stockOperation.permission?.canEdit !== false);

export const useUrlQueryParams = () => {
  return new URLSearchParams(useLocation().search);
};

export function getStockOperationUniqueId() {
  return `${new Date().getTime()}-${Math.random().toString(36).substring(2, 16)}`;
}

export const launchStockOperationsModal = (title: string, requireReason: boolean, operation: StockOperationDTO) => {
  const dispose = showModal('stock-operations-modal', {
    title: title,
    operation: operation,
    requireReason: requireReason,
    closeModal: () => dispose(),
  });
};
