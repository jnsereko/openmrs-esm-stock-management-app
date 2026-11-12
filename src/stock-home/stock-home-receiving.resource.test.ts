import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStockOperations } from '../stock-operations/stock-operations.resource';
import { useStockReceiving } from './stock-home-receiving.resource';

vi.mock('../stock-operations/stock-operations.resource', () => ({ useStockOperations: vi.fn() }));

describe('useStockReceiving', () => {
  it('lists completed receipts only, newest first', () => {
    vi.mocked(useStockOperations).mockReturnValue({
      items: {
        results: [
          { uuid: 'old', operationType: 'receipt', status: 'COMPLETED', completedDate: '2026-11-01T10:00:00.000+0000' },
          {
            uuid: 'cancelled',
            operationType: 'receipt',
            status: 'CANCELLED',
            dateCreated: '2026-11-12T10:00:00.000+0000',
          },
          { uuid: 'new', operationType: 'receipt', status: 'COMPLETED', completedDate: '2026-11-11T10:00:00.000+0000' },
          {
            uuid: 'issue',
            operationType: 'stockissue',
            status: 'COMPLETED',
            completedDate: '2026-11-12T10:00:00.000+0000',
          },
        ],
      },
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useStockReceiving({}));

    expect(result.current.items.map((item) => item.uuid)).toEqual(['new', 'old']);
    expect(useStockOperations).toHaveBeenCalledWith(expect.objectContaining({ status: 'COMPLETED' }));
  });
});
