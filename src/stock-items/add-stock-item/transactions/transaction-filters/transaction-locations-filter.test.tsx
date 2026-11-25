import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionsLocationsFilter from './transaction-locations-filter.component';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));
vi.mock('../../../../stock-lookups/stock-lookups.resource', () => ({
  useStockTagLocations: () => ({
    stockLocations: [
      { id: 'loc-a', name: 'Central pharmacy' },
      { id: 'loc-b', name: 'Dispensary' },
    ],
  }),
}));

describe('Transactions location filter', () => {
  it('chooses a location, and « All locations » removes it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TransactionsLocationsFilter name="loc" placeholder="Filter by Location" onLocationIdChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Dispensary'));
    expect(onChange).toHaveBeenLastCalledWith('loc-b');

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('All locations'));
    expect(onChange).toHaveBeenLastCalledWith('');
  });
});
