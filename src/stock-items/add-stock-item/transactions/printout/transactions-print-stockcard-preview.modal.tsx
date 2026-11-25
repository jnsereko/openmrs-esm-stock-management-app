import React, { useRef } from 'react';
import { ModalBody, ModalHeader, ModalFooter, Button } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import { getCoreTranslation } from '@openmrs/esm-framework';
import { PRINT_MAX_ROWS } from '../transactions.resource';
import TransactionsStockcardPrintout from './transactions-stockcard-printout.component';

type TransactionsStockcardPrintPreviewModalProps = {
  onClose?: () => void;
  title?: string;
  columns: any;
  data: any;
  /** More rows exist than the print collects */
  truncated?: boolean;
};

const TransactionsStockcardPrintPreviewModal: React.FC<TransactionsStockcardPrintPreviewModalProps> = ({
  onClose,
  title,
  columns,
  data,
  truncated,
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
        title={t('printStockCard', 'Print Stock Card')}
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
          <TransactionsStockcardPrintout title={title} columns={columns} items={data} />
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

export default TransactionsStockcardPrintPreviewModal;
