import { describe, expect, it } from 'vitest';
import { OperationType } from '../../core/api/types/stockOperation/StockOperationType';
import { type StockOperationItemDTO } from '../../core/api/types/stockOperation/StockOperationItemDTO';
import { getStockOperationItemFormSchema } from '../validation-schema';
import { requisitionItemsToIssueItems } from './stock-operations-form-utils';

describe('requisitionItemsToIssueItems', () => {
  // A Stock Issue made from a requisition showed an empty « Demandé » (#641)
  it("keeps what the requisition asked for as the issue line's requested quantity", () => {
    const requisitionLine = {
      uuid: 'requisition-line-uuid',
      stockItemUuid: 'paracetamol',
      stockItemPackagingUOMUuid: 'tablet',
      quantity: 9,
    } as StockOperationItemDTO;
    const fields = getStockOperationItemFormSchema(OperationType.STOCK_ISSUE_OPERATION_TYPE).keyof()
      .options as Array<string>;

    const [line] = requisitionItemsToIssueItems([requisitionLine], fields, () => undefined);

    expect(line).toEqual({
      uuid: 'requisition-line-uuid',
      stockItemUuid: 'paracetamol',
      stockItemPackagingUOMUuid: 'tablet',
      quantity: 9,
      quantityRequested: 9,
      quantityRequestedPackagingUOMUuid: 'tablet',
    });
    expect(getStockOperationItemFormSchema(OperationType.STOCK_ISSUE_OPERATION_TYPE).parse(line)).toEqual(line);
  });

  it('gives no lines for a requisition not loaded yet', () => {
    expect(requisitionItemsToIssueItems(undefined, ['uuid'], () => undefined)).toEqual([]);
  });
});
