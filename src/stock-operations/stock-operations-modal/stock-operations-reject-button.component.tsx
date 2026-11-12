import React, { useCallback } from 'react';
import { Button } from '@carbon/react';
import { CloseOutline } from '@carbon/react/icons';
import { useTranslation } from 'react-i18next';
import { showModal } from '@openmrs/esm-framework';
import { type StockOperationDTO } from '../../core/api/types/stockOperation/StockOperationDTO';

interface StockOperationRejectButtonProps {
  operation: StockOperationDTO;
}

const StockOperationRejectButton: React.FC<StockOperationRejectButtonProps> = ({ operation }) => {
  const { t } = useTranslation();
  const launchRejectModal = useCallback(() => {
    const dispose = showModal('stock-operations-modal', {
      title: 'Reject',
      operation: operation,
      requireReason: true,
      closeModal: () => dispose(),
    });
  }, [operation]);

  // A cross for Reject, the loop arrows for Return (they were the other way round)
  return (
    <Button onClick={launchRejectModal} renderIcon={(props) => <CloseOutline size={16} {...props} />}>
      {t('reject', 'Reject')}
    </Button>
  );
};

export default StockOperationRejectButton;
