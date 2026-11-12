import React from 'react';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { type StockOperationItemDTO } from '../../../core/api/types/stockOperation/StockOperationItemDTO';
import StockItemsTable from './stock-items-table';

const items = [
  { uuid: 'item-1', commonName: 'Paracetamol 500mg', quantity: 10 },
  { uuid: 'item-2', commonName: 'Amoxicillin 250mg', quantity: 5 },
] as Array<StockOperationItemDTO>;

describe('StockItemsTable search', () => {
  it.each(['paracetamol', 'Paracetamol', 'PARACETAMOL'])('finds the line whatever the case of "%s"', async (query) => {
    const user = userEvent.setup();
    render(<StockItemsTable items={items} />);

    await user.type(screen.getByRole('searchbox'), query);

    expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument();
    expect(screen.queryByText('Amoxicillin 250mg')).not.toBeInTheDocument();
  });
});
