import { type StockOperationDTO } from '../../core/api/types/stockOperation/StockOperationDTO';
import { OperationType, type StockOperationType } from '../../core/api/types/stockOperation/StockOperationType';
import { LocationTypeLocation } from '../../core/api/types/stockOperation/LocationType';
import { type StockOperationItemDTO } from '../../core/api/types/stockOperation/StockOperationItemDTO';
import { pick } from '../../core/utils/utils';

export function mapIssueStockLocations(stockOperation) {
  /** Since we are using requisition information to issue stock,
      please note that the locations will be inverted: the destination listed on the requisition will become the issuing location.
  */
  const { sourceUuid, sourceName, destinationUuid, destinationName } = stockOperation;
  return {
    ...stockOperation,
    sourceUuid: destinationUuid,
    sourceName: destinationName,
    destinationUuid: sourceUuid,
    destinationName: sourceName,
  };
}

export const getStockOperationLocationByOperationType = (
  operationType: OperationType,
  stockOperation?: StockOperationDTO,
) => {
  if (operationType === OperationType.STOCK_ISSUE_OPERATION_TYPE)
    return {
      sourceUuid: stockOperation?.destinationUuid ?? '',
      destinationUuid: stockOperation?.sourceUuid ?? '',
    };

  return {
    sourceUuid: stockOperation?.sourceUuid ?? '',
    destinationUuid: stockOperation?.destinationUuid ?? '',
  };
};

/**
 * The party whose stock an operation draws on or adds to: its source when that is a stock location,
 * otherwise its destination (a receipt's source is a supplier).
 */
export function getOperationStockPartyUuid(
  stockOperationType: StockOperationType | null | undefined,
  sourceUuid: string | null | undefined,
  destinationUuid: string | null | undefined,
) {
  return stockOperationType?.hasSource && stockOperationType?.sourceType === LocationTypeLocation
    ? sourceUuid
    : destinationUuid;
}

/**
 * The lines of a Stock Issue made from a requisition: each requisition line's item and quantity, which is
 * also what was asked for (« Demandé », quantityRequested in the requisition's unit). The batch is chosen
 * on the issue, and the line's uuid is the requisition's, which the submission leaves out (#641).
 */
export function requisitionItemsToIssueItems(
  items: Array<StockOperationItemDTO> | null | undefined,
  fields: Array<string>,
  toDate: (value: unknown) => Date | undefined,
) {
  return (items ?? []).map((item) => {
    return pick(
      {
        ...item,
        expiration: item?.expiration ? toDate(item.expiration) : undefined,
        quantityRequested: item.quantity,
        quantityRequestedPackagingUOMUuid: item.stockItemPackagingUOMUuid,
      },
      fields,
    );
  });
}
