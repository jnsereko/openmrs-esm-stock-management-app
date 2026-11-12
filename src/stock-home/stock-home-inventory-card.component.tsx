import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@carbon/react';
import { WarningHex } from '@carbon/react/icons';
import { showModal } from '@openmrs/esm-framework';
import { useStockInventory } from './stock-home-inventory-expiry.resource';
import { expiringWithin } from './expiry.utils';
import { useStockInventoryItems } from './stock-home-inventory-items.resource';
import styles from './stock-home-detail-card.scss';
import { useStockItemInventory } from '../stock-items/stock-items.resource';
import { LocationStockItemBatchNo } from '../core/api/types/stockItem/StockItem';
import { ResourceRepresentation } from '../core/api/api';

const StockHomeInventoryCard = () => {
  const { t } = useTranslation();
  const { items: expiryItems, isLoading: inventoryLoading } = useStockInventory();
  const { items: stockItems, isLoading } = useStockInventoryItems();
  // Batches carry no quantity; take each batch's quantity on hand, summed over locations, from the inventory
  const { items: inventory } = useStockItemInventory({
    v: ResourceRepresentation.Default,
    groupBy: LocationStockItemBatchNo,
    includeBatchNo: true,
  });

  if (isLoading || inventoryLoading) {
    return null;
  }

  if (stockItems?.length === 0) {
    return <p className={styles.content}>{t('noInventoryAlerts', 'No inventory alerts to display')}</p>;
  }

  const mergedArray = expiryItems
    .filter((batch) => batch?.expiration)
    .map((batch) => {
      const matchingItem = stockItems?.find((item) => batch?.stockItemUuid === item.uuid);
      const quantity = inventory?.results
        ?.filter((row) => row.stockBatchUuid === batch.uuid)
        .reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);
      return { ...matchingItem, ...batch, quantity };
    });

  const filteredData = expiringWithin(mergedArray, 180).slice(0, 5);

  const launchExpiredStockModal = () => {
    const dispose = showModal('expired-stock-modal', {
      closeModal: () => dispose(),
      expiredStock: mergedArray,
    });
  };

  return (
    <>
      {filteredData.map((item, index) => (
        <div className={styles.card} key={index}>
          <div className={styles.colorLineRed} />
          <div className={styles.icon}>
            <WarningHex size={40} color={'#DA1E28'} />
          </div>
          <div className={styles.cardText}>
            <p>{t('expiringStock', 'Expiring stock')}</p>
            <p>
              <strong>{item?.drugName ?? item?.commonName}</strong>{' '}
              {t('batchQuantityLabel', 'Batch number: {{batchNo}}, quantity: {{quantity}} {{unit}}', {
                batchNo: item?.batchNo,
                quantity: item?.quantity ?? '--',
                unit: item?.dispensingUnitName ?? '',
                interpolation: { escapeValue: false },
              })}
            </p>
          </div>
        </div>
      ))}
      <Button kind="ghost" onClick={launchExpiredStockModal} size="sm">
        {t('viewAll', 'View All')}
      </Button>
    </>
  );
};

export default StockHomeInventoryCard;
