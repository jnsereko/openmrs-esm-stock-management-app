import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useConfig } from '@openmrs/esm-framework';
import TransactionsBincardPrintout from './transactions-bincard-printout.component';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));

const columns = [
  { key: 'date', header: 'Date' },
  { key: 'transaction', header: 'Transaction' },
  { key: 'balance', header: 'Balance' },
];
const data = [
  { id: 'a', date: '13 Nov 2026', transaction: 'Stock Issue', balance: '40 Comprimé' },
  { id: 'b', date: '14 Nov 2026', transaction: 'Receipt', balance: '40 Comprimé' },
];

describe('Bin card printout', () => {
  it('renders every movement it is given, with the item name', () => {
    vi.mocked(useConfig).mockReturnValue({ logo: { src: null, alt: 'Logo', name: 'Hospital' } });
    render(<TransactionsBincardPrintout title="paracetamol" columns={columns} data={data} />);

    expect(screen.getByText('Paracetamol')).toBeInTheDocument();
    expect(screen.getByText('Stock Issue')).toBeInTheDocument();
    expect(screen.getByText('Receipt')).toBeInTheDocument();
    expect(screen.getByText('Hospital')).toBeInTheDocument();
  });

  it('reads the logo from this app, not from another module whose config never loads here', () => {
    vi.mocked(useConfig).mockReturnValue({ logo: { src: null, alt: 'Logo', name: null } });
    render(<TransactionsBincardPrintout title="item" columns={columns} data={data} />);

    expect(useConfig).toHaveBeenCalled();
    for (const call of vi.mocked(useConfig).mock.calls) {
      expect(call[0]).toBeUndefined();
    }
  });
});
