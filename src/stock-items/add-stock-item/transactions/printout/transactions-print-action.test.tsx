import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { showModal, useConfig } from '@openmrs/esm-framework';
import TransactionsPrintAction from './transactions-print-action.component';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));
vi.mock('../../../stock-items.resource', () => ({
  useStockItem: () => ({ item: { drugName: 'Paracetamol' }, isLoading: false }),
  useStockItemTransactions: () => ({ items: {}, isLoading: false }),
  useStockItemInventory: () => ({ items: {} }),
}));

const page = [{ id: 'p1' }];
const everything = [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }];

const openBinCard = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: /additional actions/i }));
  await user.click(screen.getByText('Print Bin Card'));
};

describe('Transactions print action', () => {
  it('opens the bin card with the movements of the whole filtered list', async () => {
    vi.mocked(useConfig).mockReturnValue({ enablePrintButton: true });
    const getPrintRows = vi.fn().mockResolvedValue(everything);
    render(<TransactionsPrintAction itemUuid="item" columns={[]} data={page} getPrintRows={getPrintRows} />);
    await openBinCard();

    await waitFor(() => expect(showModal).toHaveBeenCalled());
    const [name, props] = vi.mocked(showModal).mock.calls[0];
    expect(name).toBe('transactions-print-bincard-preview-modal');
    expect((props as { data: unknown }).data).toEqual(everything);
    expect((props as { title: string }).title).toBe('Paracetamol');
  });

  it('falls back to the page shown when the full list cannot be fetched', async () => {
    vi.mocked(useConfig).mockReturnValue({ enablePrintButton: true });
    const getPrintRows = vi.fn().mockRejectedValue(new Error('boom'));
    render(<TransactionsPrintAction itemUuid="item" columns={[]} data={page} getPrintRows={getPrintRows} />);
    await openBinCard();

    await waitFor(() => expect(showModal).toHaveBeenCalled());
    expect((vi.mocked(showModal).mock.calls[0][1] as { data: unknown }).data).toEqual(page);
  });
});
