import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Form, InlineLoading, ModalBody, ModalFooter, ModalHeader, TextArea } from '@carbon/react';
import { getCoreTranslation, restBaseUrl, showSnackbar } from '@openmrs/esm-framework';
import { type StockOperationDTO } from '../../core/api/types/stockOperation/StockOperationDTO';
import {
  type StopOperationAction,
  type StopOperationActionType,
} from '../../core/api/types/stockOperation/StockOperationAction';
import { executeStockOperationAction } from '../stock-operations.resource';
import { extractErrorMessagesFromResponse } from '../../constants';
import { useHandleMutate } from '../../utils';
import styles from './stock-operations.scss';

interface StockOperationsModalProps {
  title: string;
  requireReason: boolean;
  operation: StockOperationDTO;
  closeModal: () => void;
}

const StockOperationsModal: React.FC<StockOperationsModalProps> = ({ title, requireReason, operation, closeModal }) => {
  const confirmType = title.toLocaleLowerCase().trim();
  const { t } = useTranslation();
  const handleMutate = useHandleMutate();
  const [notes, setNotes] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  // `title` is the English action name and selects the action below; show its translation
  const actionLabels: Record<string, string> = {
    submit: t('submitAction', 'Submit'),
    dispatch: t('dispatchAction', 'Dispatch'),
    complete: t('completeAction', 'Complete'),
    'complete dispatch': t('completeDispatchAction', 'Complete dispatch'),
    cancel: t('cancelAction', 'Cancel'),
    reject: t('rejectAction', 'Reject'),
    return: t('returnAction', 'Return'),
    approve: t('approveAction', 'Approve'),
  };
  const actionLabel = actionLabels[confirmType] ?? title;

  const handleClick = async (event) => {
    event.preventDefault();

    setIsApproving(true);

    let actionName: StopOperationActionType | null = null;

    switch (confirmType) {
      case 'submit':
        actionName = 'SUBMIT';
        break;
      case 'dispatch':
        actionName = 'DISPATCH';
        break;
      case 'complete':
        actionName = 'COMPLETE';
        break;
      case 'complete dispatch':
        actionName = 'COMPLETE';
        break;
      case 'cancel':
        actionName = 'CANCEL';
        break;
      case 'reject':
        actionName = 'REJECT';
        break;
      case 'return':
        actionName = 'RETURN';
        break;
      case 'approve':
        actionName = 'APPROVE';
        break;
      case 'dispatchapproval':
        // messagePrefix = "dispatch";
        actionName = 'DISPATCH';
        break;
    }
    if (!actionName) {
      return;
    }

    const payload: StopOperationAction = {
      name: actionName,
      uuid: operation?.uuid,
      reason: notes,
    };

    // submit action
    executeStockOperationAction(payload).then(
      () => {
        setIsApproving(false);
        // One line: the title (« Opération : Soumettre ») said again what the subtitle says (#636)
        showSnackbar({
          title: t('operationSuccessful', 'You have successfully {{title}} operation', {
            title: actionLabel,
          }),
          kind: 'success',
          isLowContrast: true,
        });
        closeModal();
        handleMutate(`${restBaseUrl}/stockmanagement/stockoperation`);
      },
      (err) => {
        setIsApproving(false);
        const errorMessages = extractErrorMessagesFromResponse(err);
        const message = errorMessages[0].replace(/[[\]]/g, '');
        showSnackbar({
          title: t('stockOperationErrorTitle', 'Error on saving form'),
          subtitle: t('stockOperationErrorDescription', 'Details: {{message}}', {
            message,
          }),
          kind: 'error',
        });
        closeModal();
      },
    );
  };

  return (
    <div>
      <Form onSubmit={handleClick}>
        <ModalHeader
          iconDescription={t('close', 'Close')}
          closeModal={closeModal}
          title={t('operationModalTitle', '{{title}} Operation', { title: actionLabel })}
        />
        <ModalBody>
          <div className={styles.modalBody}>
            <section className={styles.section}>
              <h5 className={styles.section}>
                {t('confirmOperation', 'Would you really like to {{title}} the operation?', { title: actionLabel })}
              </h5>
            </section>
            <br />
            {requireReason && (
              <section className={styles.section}>
                <TextArea
                  labelText={t('notes', 'Please explain the reason:')}
                  id="nextNotes"
                  name="nextNotes"
                  invalidText={t('required', 'Required')}
                  maxCount={500}
                  enableCounter
                  onChange={(e) => setNotes(e.target.value)}
                />
              </section>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" onClick={closeModal}>
            {getCoreTranslation('cancel')}
          </Button>
          {isApproving ? <InlineLoading /> : <Button type="submit">{actionLabel}</Button>}
        </ModalFooter>
      </Form>
    </div>
  );
};

export default StockOperationsModal;
