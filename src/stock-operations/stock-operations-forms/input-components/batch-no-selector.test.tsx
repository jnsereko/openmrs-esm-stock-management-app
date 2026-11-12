import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { type StockItemInventory } from '../../../core/api/types/stockItem/StockItemInventory';
import { formatForDatePicker } from '../../../constants';
import { useStockItemInventory } from '../../../stock-items/stock-items.resource';
import BatchNoSelector from './batch-no-selector.component';

vi.mock('../../../stock-items/stock-items.resource', () => ({
  useStockItemInventory: vi.fn(),
}));

const mockUseStockItemInventory = vi.mocked(useStockItemInventory);

const row = (
  stockBatchUuid: string,
  batchNumber: string,
  quantity: number,
  expiration: Date | null,
  partyUuid = 'rx',
): StockItemInventory =>
  ({ partyUuid, stockItemUuid: 'item', stockBatchUuid, batchNumber, quantity, expiration } as StockItemInventory);

const mockInventory = (rows: StockItemInventory[], isLoading = false) =>
  mockUseStockItemInventory.mockReturnValue({
    items: { results: rows } as ReturnType<typeof useStockItemInventory>['items'],
    isLoading,
    error: undefined,
  });

const optionBatchNumbers = () => screen.getAllByRole('option').map((option) => option.textContent.split(' |')[0]);

describe('BatchNoSelector', () => {
  const mockOnValueChange = vi.fn();
  const mockStockItemUuid = 'test-uuid';
  const mockExpiration = new Date();

  beforeEach(() => {
    mockOnValueChange.mockReset();
    mockInventory([row('1', 'BATCH-001', 10, mockExpiration), row('2', 'BATCH-002', 20, mockExpiration)]);
  });

  it('should render a loading skeleton when "isLoading" is true', () => {
    mockInventory([], true);

    render(<BatchNoSelector stockItemUuid={mockStockItemUuid} onValueChange={mockOnValueChange} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render a combobox with batch numbers', async () => {
    render(<BatchNoSelector stockItemUuid={mockStockItemUuid} onValueChange={mockOnValueChange} />);

    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText(/batch number/i)).toBeInTheDocument();
  });

  it('should handle batch selection', async () => {
    const user = userEvent.setup();

    render(<BatchNoSelector stockItemUuid={mockStockItemUuid} onValueChange={mockOnValueChange} />);

    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    await user.type(combobox, 'BATCH-001');

    const option = screen.getByText(`BATCH-001 | Qty: 10 | Expiry: ${formatForDatePicker(mockExpiration)}`);

    await user.click(option);

    expect(mockOnValueChange).toHaveBeenCalledWith('1');
  });

  it('should display error message when error prop is provided', () => {
    const errorMessage = 'This is an error';
    render(
      <BatchNoSelector stockItemUuid={mockStockItemUuid} onValueChange={mockOnValueChange} error={errorMessage} />,
    );
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should filter out batches with no stock', async () => {
    const user = userEvent.setup();
    mockInventory([row('1', 'BATCH-001', 10, mockExpiration), row('2', 'BATCH-002', 0, mockExpiration)]);

    render(<BatchNoSelector stockItemUuid={mockStockItemUuid} onValueChange={mockOnValueChange} />);
    await user.click(screen.getByRole('combobox'));

    expect(optionBatchNumbers()).toEqual(['BATCH-001']);
  });

  it('should keep the batch already on the line even when it has no stock left', async () => {
    const user = userEvent.setup();
    mockInventory([row('1', 'BATCH-001', 10, mockExpiration), row('2', 'BATCH-002', 0, mockExpiration)]);

    render(<BatchNoSelector stockItemUuid={mockStockItemUuid} initialValue="2" onValueChange={mockOnValueChange} />);
    await user.click(screen.getByRole('button', { name: /open/i }));

    expect(optionBatchNumbers()).toEqual(['BATCH-001', 'BATCH-002']);
  });

  it('should list the batch that expires soonest first', async () => {
    const user = userEvent.setup();
    mockInventory([
      row('late', 'LATE', 10, new Date(2027, 5, 30)),
      row('none', 'NONE', 10, null),
      row('soon', 'SOON', 10, new Date(2026, 11, 31)),
    ]);

    render(<BatchNoSelector stockItemUuid={mockStockItemUuid} onValueChange={mockOnValueChange} />);
    await user.click(screen.getByRole('combobox'));

    expect(optionBatchNumbers()).toEqual(['SOON', 'LATE', 'NONE']);
  });

  // #634: on a Stock Issue at Pharmacie (Rx), every batch with stock there, with the quantity there
  it('should ask for the stock at the source location, one row per batch', () => {
    render(<BatchNoSelector stockItemUuid={mockStockItemUuid} partyUuid="rx" onValueChange={mockOnValueChange} />);

    expect(mockUseStockItemInventory).toHaveBeenLastCalledWith(
      expect.objectContaining({
        stockItemUuid: mockStockItemUuid,
        partyUuid: 'rx',
        groupBy: 'LocationStockItemBatchNo',
        includeBatchNo: true,
      }),
    );
    expect(mockUseStockItemInventory.mock.lastCall[0]).not.toHaveProperty('limit');
  });

  it('should list all five batches of the source with their quantities there, soonest expiry first', async () => {
    const user = userEvent.setup();
    mockInventory([
      row('b3', 'UAT-B3-QA', 239, new Date(2027, 11, 30)),
      row('b5', 'UAT-B5-QA', 16, new Date(2027, 2, 16)),
      row('m60', 'UAT-M60-QA', 14, new Date(2027, 5, 16)),
      row('b9', 'UAT-B9-QA', 140, new Date(2028, 2, 30)),
      row('rcpt', 'E2E-B14-RCPT-0640', 21, new Date(2026, 11, 31)),
    ]);

    render(<BatchNoSelector stockItemUuid={mockStockItemUuid} partyUuid="rx" onValueChange={mockOnValueChange} />);
    await user.click(screen.getByRole('combobox'));

    expect(
      screen.getAllByRole('option').map((option) => option.textContent.split(' | ').slice(0, 2).join(' | ')),
    ).toEqual([
      'E2E-B14-RCPT-0640 | Qty: 21',
      'UAT-B5-QA | Qty: 16',
      'UAT-M60-QA | Qty: 14',
      'UAT-B3-QA | Qty: 239',
      'UAT-B9-QA | Qty: 140',
    ]);
  });

  it('should add up a batch across locations when no location is given', async () => {
    const user = userEvent.setup();
    mockInventory([
      row('b3', 'UAT-B3-QA', 132, mockExpiration, 'rx-disp'),
      row('b3', 'UAT-B3-QA', 239, mockExpiration, 'rx'),
    ]);

    render(<BatchNoSelector stockItemUuid={mockStockItemUuid} onValueChange={mockOnValueChange} />);
    await user.click(screen.getByRole('combobox'));

    expect(screen.getAllByRole('option').map((option) => option.textContent.split(' | ')[1])).toEqual(['Qty: 371']);
  });
});
