import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import { restBaseUrl } from '@openmrs/esm-framework';
import { type StockOperationDTO } from '../../core/api/types/stockOperation/StockOperationDTO';
import { executeStockOperationAction } from '../stock-operations.resource';
import StockOperationsModal from './stock-operations.modal';

const mockHandleMutate = vi.fn();

vi.mock('../../utils', () => ({ useHandleMutate: () => mockHandleMutate }));
vi.mock('../stock-operations.resource', () => ({ executeStockOperationAction: vi.fn() }));

describe('StockOperationsModal', () => {
  it('refreshes the stock operations after completing an operation', async () => {
    vi.mocked(executeStockOperationAction).mockResolvedValue({} as any);
    const closeModal = vi.fn();
    render(
      <StockOperationsModal
        title="Complete"
        requireReason={false}
        operation={{ uuid: 'operation-uuid' } as StockOperationDTO}
        closeModal={closeModal}
      />,
    );

    // The confirm button carries the action's own verb
    await userEvent.click(screen.getByRole('button', { name: /^complete$/i }));

    await waitFor(() => expect(mockHandleMutate).toHaveBeenCalledWith(`${restBaseUrl}/stockmanagement/stockoperation`));
    expect(executeStockOperationAction).toHaveBeenCalledWith(expect.objectContaining({ name: 'COMPLETE' }));
    expect(closeModal).toHaveBeenCalled();
  });

  // Cancelling showed two « Annuler » buttons, and Carbon's counter read « Character limit 500 » (#641)
  it('tells closing the dialog from cancelling the operation, and counts the reason in the translated text', async () => {
    render(
      <StockOperationsModal
        title="Cancel"
        requireReason
        operation={{ uuid: 'operation-uuid' } as StockOperationDTO}
        closeModal={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel operation' })).toBeInTheDocument();
    expect(screen.queryByText(/Character limit/)).not.toBeInTheDocument();

    await userEvent.type(screen.getByRole('textbox'), 'Erreur');
    expect(screen.getByText('6 / 500 characters')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('maxlength', '500');
  });
});
