import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useGetReports } from '../stock-reports.resource';
import StockReports from './stock-reports.component';

vi.mock('../stock-reports.resource', () => ({ useGetReports: vi.fn() }));
vi.mock('../item-movement/item-movement-report.component', () => ({
  default: ({ onClose }) => (
    <div>
      <h2>item movement view</h2>
      <button type="button" onClick={onClose}>
        back
      </button>
    </div>
  ),
}));

describe('Stock reports page', () => {
  it('opens the on-screen item movement from its entry, and comes back to the downloadable reports', async () => {
    vi.mocked(useGetReports).mockReturnValue({
      reports: [],
      isLoading: false,
      currentPage: 1,
      pageSizes: [10],
      totalItems: 0,
      goTo: vi.fn(),
      currentPageSize: 10,
      setPageSize: vi.fn(),
    } as never);
    const user = userEvent.setup();
    render(<StockReports />);

    expect(screen.getByText('Item movement')).toBeInTheDocument();
    expect(screen.getByText('List of reports requested by users.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByText('item movement view')).toBeInTheDocument();
    expect(screen.queryByText('List of reports requested by users.')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'back' }));
    expect(screen.getByText('List of reports requested by users.')).toBeInTheDocument();
  });
});
