import React, { useRef } from 'react';
import { ModalBody, ModalHeader, ModalFooter, Button } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import { getCoreTranslation } from '@openmrs/esm-framework';
import { PRINT_MAX_ROWS } from '../transactions.resource';
import TransactionsBincardPrintout from './transactions-bincard-printout.component';

type TransactionsBincardPrintPreviewModalProps = {
  onClose?: () => void;
  title?: string;
  columns: any;
  data: any;
  /** More rows exist than the print collects */
  truncated?: boolean;
  binOrStockCard: number;
};

const TransactionsBincardPrintPreviewModal: React.FC<TransactionsBincardPrintPreviewModalProps> = ({
  onClose,
  title,
  columns,
  data,
  truncated,
  binOrStockCard,
}) => {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => ref.current,
  });
  return (
    <>
      <ModalHeader
        iconDescription={t('close', 'Close')}
        closeModal={onClose}
        title={t('printBinCard', 'Print Bin Card')}
      />
      <ModalBody>
        <div ref={ref}>
          {truncated && (
            <p>
              {t('printTruncated', 'Only the first {{count}} movements are listed: narrow the period or the location.', {
                count: PRINT_MAX_ROWS,
              })}
            </p>
          )}
          <TransactionsBincardPrintout title={title} columns={columns} data={data} />
        </div>
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={onClose}>
          {getCoreTranslation('cancel')}
        </Button>
        <Button type="button" onClick={handlePrint}>
          {getCoreTranslation('print')}
        </Button>
      </ModalFooter>
    </>
  );
};

export default TransactionsBincardPrintPreviewModal;
