import { InlineLoading } from '@carbon/react';
import { showSnackbar } from '@openmrs/esm-framework';
import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceRepresentation } from '../../../core/api/api';
import { LocationStockItemBatchNo } from '../../../core/api/types/stockItem/StockItem';
import { useStockItemInventory } from '../../../stock-items/stock-items.resource';
import styles from './stock-operation-items-form-step.scc.scss';

/**
 * The quantity of the item at one stock location (party), all batches together. It added up every
 * location (the first 10 batches of them), so Box 1 and the central pharmacy showed the same number.
 * Without a party, the total of all locations.
 *
 * Once the line has a batch (a Stock Issue's « N° de Lot »), the quantity of that batch at the location:
 * the line can't take more than that, and « Disponible : 411 » for the location next to a batch of 16
 * read as the batch's (#641).
 *
 * Before a batch is chosen, the sum of the batches the « N° de Lot » list offers (same request): those
 * with stock left and a known batch. The location total counted a batch with a negative balance against
 * the others, and a voided batch the list doesn't show (#644).
 */
const StockAvailability: React.FC<{
  stockItemUuid: string;
  partyUuid?: string | null;
  stockBatchUuid?: string | null;
}> = ({ stockItemUuid, partyUuid, stockBatchUuid }) => {
  const {
    items: inventory,
    isLoading,
    error,
  } = useStockItemInventory({
    v: ResourceRepresentation.Default,
    stockItemUuid,
    partyUuid,
    groupBy: LocationStockItemBatchNo,
    ...(stockBatchUuid ? { stockBatchUuid } : { includeBatchNo: true }),
  });
  const items = inventory?.results;
  const { t } = useTranslation();

  const totalQuantity = useMemo(() => {
    if (!items?.length) return 0;
    if (stockBatchUuid) {
      return items.reduce((total, row) => total + (Number(row.quantity) || 0), 0);
    }
    const batchTotals = new Map<string, number>();
    for (const row of items) {
      if (!row.stockBatchUuid) continue;
      batchTotals.set(row.stockBatchUuid, (batchTotals.get(row.stockBatchUuid) ?? 0) + (Number(row.quantity) || 0));
    }
    return [...batchTotals.values()]
      .filter((quantity) => quantity > 0)
      .reduce((total, quantity) => total + quantity, 0);
  }, [items, stockBatchUuid]);
  const commonUOM = useMemo(() => {
    if (!items?.length) return '';
    return items[0]?.quantityUoM || '';
  }, [items]);

  useEffect(() => {
    if (error) {
      showSnackbar({
        kind: 'error',
        title: t('stockAvailabilityError', 'Error loading stock availability'),
        subtitle: error?.message,
      });
    }
  }, [error, t]);

  if (isLoading) return <InlineLoading status="active" iconDescription="Loading" />;
  if (error) return <>--</>;

  return (
    <div className={styles.availability}>
      {totalQuantity > 0 ? (
        <span>
          {t('availableQuantity', 'Available: {{quantity}} {{unit}}', {
            quantity: totalQuantity.toLocaleString(),
            unit: commonUOM ?? '',
            interpolation: { escapeValue: false },
          })}
        </span>
      ) : (
        <span className={styles.outOfStock}>{t('outOfStockLabel', 'Out of Stock')}</span>
      )}
    </div>
  );
};

export default StockAvailability;
