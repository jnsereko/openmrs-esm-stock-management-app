import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import StockOperationExpandedRow from './stock-operation-expanded-row.component';

vi.mock('../../../stock-lookups/stock-lookups.resource', () => ({
  useStockOperationTypes: () => ({ types: { results: [] }, isLoading: false, error: undefined }),
}));

describe('StockOperationExpandedRow', () => {
  it('renders nothing, rather than crashing, when the operation is gone from the list', () => {
    const { container } = render(<StockOperationExpandedRow model={undefined} />);

    expect(container).toBeEmptyDOMElement();
  });
});
