import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { type StockOperationDTO } from '../core/api/types/stockOperation/StockOperationDTO';
import { type StockOperationType } from '../core/api/types/stockOperation/StockOperationType';
import useStockOperationLinks from './stock-operations-forms/hooks/useStockOperationLinks';
import StockOperationLinks from './stock-operation-links.component';

vi.mock('./stock-operations-forms/hooks/useStockOperationLinks', () => ({ default: vi.fn() }));
vi.mock('./stock-operations-forms/stock-operation-related-link.component', () => ({
  default: ({ operationNumber }: { operationNumber: string }) => <span>{operationNumber}</span>,
}));

describe('StockOperationLinks', () => {
  // « Related Transactions: » and « [CANCELLED]Stock Issue »: English statuses run into the next type (#641)
  it('lists each linked operation on its own line with its status translated', () => {
    vi.mocked(useStockOperationLinks).mockReturnValue({
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
      operationLinks: [
        {
          uuid: 'link-1',
          parentUuid: 'requisition-uuid',
          childUuid: 'issue-1',
          childOperationTypeName: 'Stock Issue',
          childOperationNumber: 'SIS-0065',
          childStatus: 'CANCELLED',
          childVoided: false,
        },
        {
          uuid: 'link-2',
          parentUuid: 'requisition-uuid',
          childUuid: 'issue-2',
          childOperationTypeName: 'Stock Issue',
          childOperationNumber: 'SIS-0066',
          childStatus: 'DISPATCHED',
          childVoided: false,
        },
      ],
    } as unknown as ReturnType<typeof useStockOperationLinks>);

    render(
      <StockOperationLinks
        stockOperation={{ uuid: 'requisition-uuid', operationType: 'requisition' } as StockOperationDTO}
        stockOperationType={{ uuid: 'requisition-type-uuid', operationType: 'requisition' } as StockOperationType}
      />,
    );

    expect(screen.getByText('Related Transactions:')).toBeInTheDocument();
    expect(screen.getByText('[Cancelled]')).toBeInTheDocument();
    expect(screen.getByText('[Dispatched]')).toBeInTheDocument();
  });
});
