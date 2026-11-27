import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Tile } from '@carbon/react';
import { ArrowLeft } from '@carbon/react/icons';
import { useConfig } from '@openmrs/esm-framework';
import dayjs from 'dayjs';
import { type ConfigObject } from '../../config-schema';
import { type StockItemDTO } from '../../core/api/types/stockItem/StockItem';
import StockItemSearch from '../../stock-operations/stock-operations-forms/input-components/stock-item-search.component';
import Transactions from '../../stock-items/add-stock-item/transactions/transactions.component';
import { ALL_LOCATIONS_ID } from '../../stock-items/add-stock-item/transactions/transaction-filters/transaction-locations-filter.component';
import styles from './item-movement-report.scss';

/** The current calendar month, first to last day */
export const currentMonthPeriod = (today: Date = new Date()) => ({
  from: dayjs(today).startOf('month').toDate(),
  to: dayjs(today).endOf('month').startOf('day').toDate(),
});

interface ItemMovementReportProps {
  onClose?: () => void;
}

/**
 * The movements of one stock item on screen, from the Rapports page: nothing is generated on the server.
 * The list, its period and location filters, pager and printed cards are those of the item's Transactions tab.
 */
const ItemMovementReport: React.FC<ItemMovementReportProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { useItemCommonNameAsDisplay } = useConfig<ConfigObject>();
  const [stockItem, setStockItem] = useState<StockItemDTO | null>(null);
  const defaultPeriod = useMemo(() => currentMonthPeriod(), []);

  const itemName = (item: StockItemDTO) => {
    const first = useItemCommonNameAsDisplay ? item.commonName || item.drugName : item.drugName || item.commonName;
    const second = useItemCommonNameAsDisplay ? item.drugName : item.commonName;
    return second && second !== first ? `${first} (${second})` : first ?? '';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t('itemMovementReport', 'Item movement')}</h2>
        {onClose && (
          <Button kind="ghost" size="md" renderIcon={ArrowLeft} onClick={onClose}>
            {t('backToReports', 'Back to reports')}
          </Button>
        )}
      </div>
      <p className={styles.helper}>
        {t(
          'itemMovementReportHelp',
          'Search for a stock item, then choose the period and the location: its movements are shown here and can be printed.',
        )}
      </p>
      <div className={styles.search}>
        <StockItemSearch onSelectedItem={setStockItem} />
      </div>
      {stockItem ? (
        <>
          <h3 className={styles.itemName} data-testid="item-movement-item">
            {itemName(stockItem)}
          </h3>
          {/* A new item starts again from the current month and every location */}
          <Transactions
            key={stockItem.uuid}
            stockItemUuid={stockItem.uuid}
            defaultPeriod={defaultPeriod}
            defaultLocationId={ALL_LOCATIONS_ID}
          />
        </>
      ) : (
        <Tile className={styles.empty}>
          <p>{t('itemMovementChooseItem', 'Choose a stock item to see its movements.')}</p>
        </Tile>
      )}
    </div>
  );
};

export default ItemMovementReport;
