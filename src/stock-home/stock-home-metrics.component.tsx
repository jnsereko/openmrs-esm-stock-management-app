import React from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorState } from '@openmrs/esm-framework';
import { ResourceRepresentation } from '../core/api/api';
import { useDisposalList } from './useDisposalList';
import { useStockInventory } from './stock-home-inventory-expiry.resource';
import { useStockInventoryItems } from './stock-home-inventory-items.resource';
import { type StockOperationFilter } from '../stock-operations/stock-operations.resource';
import useStockList from './useStockList';
import MetricsCard from '../core/components/card/metrics-card-component';
import styles from './stock-home.scss';
import { daysUntilExpiry, expiringWithin } from './expiry.utils';

const SIX_MONTHS_IN_DAYS = 180;

const StockManagementMetrics: React.FC = (filter: StockOperationFilter) => {
  const { t } = useTranslation();
  const { stockList: allStocks, error } = useStockList();
  const { items: expiryItems } = useStockInventory();
  const { items: stockItems } = useStockInventoryItems();

  // A batch with an expiry date expires, whether or not its stock item is in the first page of stock items
  // (the item list is paged, so most batches used to find no item, lose hasExpiration and drop out)
  const mergedArray = expiryItems
    .filter((batch) => batch?.expiration)
    .map((batch) => {
      const matchingItem = stockItems?.find((item) => batch?.stockItemUuid === item.uuid);
      return { ...matchingItem, ...batch };
    });

  // Expired, or within the item's expiry notice (six months when the item has none)
  const filteredData = mergedArray.filter((item) => {
    const remaining = daysUntilExpiry(item.expiration);
    return remaining !== null && remaining <= (item.expiryNotice || SIX_MONTHS_IN_DAYS);
  });

  // « In 6 months »: batches that expire in the next 180 days, whatever their item's notice
  const sixMonthsExpiryStocks = expiringWithin(mergedArray, SIX_MONTHS_IN_DAYS);

  const { items } = useDisposalList({
    v: ResourceRepresentation.Full,
    totalCount: true,
  });

  if (error) {
    return <ErrorState headerTitle={t('errorStockMetric', 'Error fetching stock metrics')} error={error} />;
  }

  const filteredItems =
    items && items.filter((item) => item.reasonName === 'Drug not available due to expired medication');
  const poorQualityItems = items && items.filter((item) => item.reasonName === 'Poor Quality');

  return (
    <div className={styles.cardContainer}>
      <MetricsCard
        count={{
          expiry6months: sixMonthsExpiryStocks,
        }}
        headerLabel={t('expiringStock', 'Expiring stock')}
        label={t('expiringStock', 'Expiring stock')}
        value={filteredData?.length || 0}
      />
      <MetricsCard
        label={t('outOfStock', 'Out of stock')}
        headerLabel={t('outOfStock', 'Out of stock')}
        outOfStockCount={{
          itemsBelowMin: [],
          itemsAboveMax: [],
        }}
        value={allStocks?.length}
      />
      <MetricsCard
        disposedCount={{
          expired: filteredItems,
          poorQuality: poorQualityItems,
        }}
        headerLabel={t('disposedStock', 'Disposed stock')}
        label={t('disposedStock', 'Disposed stock')}
        value={items?.length || 0}
      />
    </div>
  );
};
export default StockManagementMetrics;
