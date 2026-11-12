import { InlineLoading } from '@carbon/react';
import { showSnackbar } from '@openmrs/esm-framework';
import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceRepresentation } from '../../../core/api/api';
import { LocationStockItem } from '../../../core/api/types/stockItem/StockItem';
import { useStockItemInventory } from '../../../stock-items/stock-items.resource';
import styles from './stock-operation-items-form-step.scc.scss';

/**
 * The quantity of the item at one stock location (party), all batches together. It added up every
 * location (the first 10 batches of them), so Box 1 and the central pharmacy showed the same number.
 * Without a party, the total of all locations.
 */
const StockAvailability: React.FC<{ stockItemUuid: string; partyUuid?: string | null }> = ({
  stockItemUuid,
  partyUuid,
}) => {
  const {
    items: inventory,
    isLoading,
    error,
  } = useStockItemInventory({
    v: ResourceRepresentation.Default,
    stockItemUuid,
    partyUuid,
    groupBy: LocationStockItem,
  });
  const items = inventory?.results;
  const { t } = useTranslation();

  const totalQuantity = useMemo(() => {
    if (!items?.length) return 0;
    return items.reduce((total, row) => {
      return total + (Number(row.quantity) || 0);
    }, 0);
  }, [items]);
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
