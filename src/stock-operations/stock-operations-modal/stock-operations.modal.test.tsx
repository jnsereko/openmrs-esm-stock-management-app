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

    await userEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => expect(mockHandleMutate).toHaveBeenCalledWith(`${restBaseUrl}/stockmanagement/stockoperation`));
    expect(executeStockOperationAction).toHaveBeenCalledWith(expect.objectContaining({ name: 'COMPLETE' }));
    expect(closeModal).toHaveBeenCalled();
  });
});
