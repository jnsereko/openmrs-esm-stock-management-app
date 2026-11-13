import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
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

  // The apostrophe of « Annuler l'opération » showed as `&#39;`: i18next escaped it, then React did (#644)
  it('shows an apostrophe in the translated action as it is, in the title and the question', async () => {
    const i18n = i18next.createInstance();
    await i18n.init({
      lng: 'fr',
      resources: {
        fr: {
          translation: {
            cancelOperationAction: "Annuler l'opération",
            operationModalTitle: 'Opération : {{title}}',
            confirmOperation: "Confirmez-vous l'action « {{title}} » sur cette opération ?",
          },
        },
      },
    });
    const translation = useTranslation() as unknown as { t: (...args: Array<unknown>) => string };
    const tSpy = vi
      .spyOn(translation, 't')
      .mockImplementation((key: string, defaultValue: string, options: object = {}) =>
        i18n.t(key, { defaultValue, ...options }),
      );

    render(
      <StockOperationsModal
        title="Cancel"
        requireReason
        operation={{ uuid: 'operation-uuid' } as StockOperationDTO}
        closeModal={vi.fn()}
      />,
    );

    expect(screen.getByText("Opération : Annuler l'opération")).toBeInTheDocument();
    expect(
      screen.getByText("Confirmez-vous l'action « Annuler l'opération » sur cette opération ?"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/&#39;/)).not.toBeInTheDocument();
    tSpy.mockRestore();
  });
});
