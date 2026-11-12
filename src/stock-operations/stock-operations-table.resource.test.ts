import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useStockOperations } from './stock-operations.resource';
import { useStockOperationPages } from './stock-operations-table.resource';

vi.mock('./stock-operations.resource', () => ({ useStockOperations: vi.fn() }));

const mockUseStockOperations = vi.mocked(useStockOperations);

describe('useStockOperationPages', () => {
  beforeEach(() => {
    mockUseStockOperations.mockReset();
    mockUseStockOperations.mockImplementation((filter) => ({
      items: {
        results: [{ uuid: `page-${filter.startIndex}` }],
        totalCount: 55,
      } as unknown as ReturnType<typeof useStockOperations>['items'],
      isLoading: false,
      error: undefined,
    }));
  });

  const lastFilter = () => mockUseStockOperations.mock.calls.at(-1)[0];

  it('asks the server for one page at a time', () => {
    const { result } = renderHook(() => useStockOperationPages({ status: 'NEW' }));

    expect(lastFilter()).toMatchObject({ status: 'NEW', totalCount: true, startIndex: 0, limit: 10 });
    expect(result.current.totalItems).toBe(55);

    // Page 6 of 55 operations is the server's sixth page, not page 5 again (#634)
    act(() => result.current.goTo(6));
    expect(lastFilter()).toMatchObject({ startIndex: 5, limit: 10 });
    expect(result.current.items).toEqual([{ uuid: 'page-5' }]);
  });

  it('goes back to the first page when the filter or the page size changes', () => {
    const { result, rerender } = renderHook(({ status }) => useStockOperationPages({ status }), {
      initialProps: { status: 'NEW' },
    });

    act(() => result.current.goTo(3));
    expect(lastFilter()).toMatchObject({ startIndex: 2 });

    rerender({ status: 'COMPLETED' });
    expect(result.current.currentPage).toBe(1);
    expect(lastFilter()).toMatchObject({ status: 'COMPLETED', startIndex: 0 });

    act(() => result.current.goTo(2));
    act(() => result.current.setPageSize(20));
    expect(lastFilter()).toMatchObject({ startIndex: 0, limit: 20 });
  });

  it('asks for the first page straight away when the filter changes, not the old page first', () => {
    const { result, rerender } = renderHook(({ q }) => useStockOperationPages({ q }), {
      initialProps: { q: undefined as string | undefined },
    });

    act(() => result.current.goTo(6));
    mockUseStockOperations.mockClear();

    // From page 6, a search sent one request for page 6 of the new results before page 1 (#636)
    rerender({ q: 'SIS-0058' });
    const filters = mockUseStockOperations.mock.calls.map(([filter]) => filter);
    expect(filters.length).toBeGreaterThan(0);
    filters.forEach((filter) => expect(filter).toMatchObject({ q: 'SIS-0058', startIndex: 0 }));
    expect(result.current.currentPage).toBe(1);
  });

  it('keeps the chosen page while the filter stays the same', () => {
    const { result, rerender } = renderHook(({ status }) => useStockOperationPages({ status }), {
      initialProps: { status: 'NEW' },
    });

    act(() => result.current.goTo(4));
    rerender({ status: 'NEW' });
    expect(result.current.currentPage).toBe(4);
    expect(lastFilter()).toMatchObject({ startIndex: 3 });
  });

  it('starts from the first page when the search is cleared again', () => {
    const { result, rerender } = renderHook(({ q }) => useStockOperationPages({ q }), {
      initialProps: { q: undefined as string | undefined },
    });

    act(() => result.current.goTo(6));
    rerender({ q: 'SIS' });
    rerender({ q: undefined });

    expect(result.current.currentPage).toBe(1);
    expect(lastFilter()).toMatchObject({ startIndex: 0 });
  });
});
