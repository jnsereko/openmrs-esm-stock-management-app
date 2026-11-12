import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ComboBox, SelectSkeleton } from '@carbon/react';
import { type StockBatchWithUoM } from '../../../core/api/types/stockItem/StockBatchDTO';
import { LocationStockItemBatchNo } from '../../../core/api/types/stockItem/StockItem';
import { ResourceRepresentation } from '../../../core/api/api';
import { formatExpiryDate } from '../../../core/utils/datetimeUtils';
import { useStockItemInventory } from '../../../stock-items/stock-items.resource';
import { comboBoxTranslateWithId } from '../../../core/utils/translations';

interface BatchNoSelectorProps {
  stockItemUuid: string;
  /** The location the stock is taken from; without it, the stock of every location */
  partyUuid?: string | null;
  initialValue?: string;
  onValueChange?: (value: string) => void;
  error?: string;
}

/**
 * The batches of an item that have stock at the operation's location, soonest expiry first.
 *
 * They come from the inventory of that location, one row per batch. The list was the item's batches
 * (`stockbatch`) given the quantity of the first inventory row with the same batch number, from any
 * location: a batch could show another location's quantity, and one with stock only elsewhere was
 * offered (#634).
 */
const BatchNoSelector: React.FC<BatchNoSelectorProps> = ({
  stockItemUuid,
  partyUuid,
  error,
  initialValue,
  onValueChange,
}) => {
  const { t } = useTranslation();
  const { items: inventory, isLoading } = useStockItemInventory({
    v: ResourceRepresentation.Default,
    stockItemUuid,
    partyUuid,
    groupBy: LocationStockItemBatchNo,
    includeBatchNo: true,
  });

  const filteredBatches = useMemo(() => {
    const batches = new Map<string, StockBatchWithUoM & { total: number }>();
    for (const row of inventory?.results ?? []) {
      if (!row.stockBatchUuid) continue;
      const quantity = Number(row.quantity) || 0;
      const batch = batches.get(row.stockBatchUuid);
      if (batch) {
        batch.total += quantity;
      } else {
        batches.set(row.stockBatchUuid, {
          uuid: row.stockBatchUuid,
          batchNo: row.batchNumber,
          expiration: row.expiration,
          stockItemUuid: row.stockItemUuid,
          voided: false,
          quantity: '',
          quantityUoM: row.quantityUoM,
          quantityFactor: row.quantityFactor,
          quantityUoMUuid: row.quantityUoMUuid,
          total: quantity,
        });
      }
    }

    const expiryTime = (batch: StockBatchWithUoM) =>
      batch.expiration ? new Date(batch.expiration).getTime() : Number.POSITIVE_INFINITY;

    // Soonest expiry first (first expired, first out); batches without an expiry last. The line's own
    // batch stays listed when it has no stock left, so that an existing line still shows it.
    return [...batches.values()]
      .filter((batch) => batch.total > 0 || batch.uuid === initialValue)
      .map(({ total, ...batch }) => ({ ...batch, quantity: String(total) } as StockBatchWithUoM))
      .sort((a, b) => expiryTime(a) - expiryTime(b));
  }, [inventory, initialValue]);

  const initialSelectedItem = useMemo(
    () => filteredBatches.find((batch) => batch.uuid === initialValue) ?? null,
    [filteredBatches, initialValue],
  );

  const formatQuantityDisplay = useCallback(
    (batch: StockBatchWithUoM): string => {
      if (batch.quantity === undefined) return t('unknown', 'Unknown');

      const quantity = typeof batch.quantity === 'string' ? parseFloat(batch.quantity) : batch.quantity;

      if (isNaN(quantity)) return t('unknown', 'Unknown');

      const baseQuantity = quantity.toString();

      if (!batch.quantityUoM) return baseQuantity;

      const withUnit = `${baseQuantity} ${batch.quantityUoM}`;

      if (!batch.quantityFactor) return withUnit;

      const factor = parseFloat(batch.quantityFactor);
      return !isNaN(factor) && factor > 1
        ? t('quantityWithUnitsEach', '{{quantity}} ({{factor}} units each)', {
            quantity: withUnit,
            factor,
            interpolation: { escapeValue: false },
          })
        : withUnit;
    },
    [t],
  );

  const itemToString = useCallback(
    (batch: StockBatchWithUoM | null): string => {
      if (!batch?.batchNo) return '';

      const quantityDisplay = formatQuantityDisplay(batch);
      const expiryDate = batch.expiration ? formatExpiryDate(batch.expiration) : t('noExpiry', 'No expiry');

      return t('batchOption', '{{batchNo}} | Qty: {{quantity}} | Expiry: {{expiry}}', {
        batchNo: batch.batchNo,
        quantity: quantityDisplay,
        expiry: expiryDate,
        interpolation: { escapeValue: false },
      });
    },
    [formatQuantityDisplay, t],
  );

  // Carbon's ComboBox only highlights the first match by default; the typed text narrows the batches
  // (« Filtrer... », #636). The text of the batch already chosen lists them all again, so that opening
  // the list to change it does not show that batch alone.
  const shouldFilterItem = useCallback(
    ({ item, inputValue }: { item: StockBatchWithUoM; inputValue: string | null }) => {
      const query = inputValue?.trim().toLowerCase();
      if (!query || (initialSelectedItem && inputValue === itemToString(initialSelectedItem))) return true;
      return itemToString(item).toLowerCase().includes(query);
    },
    [initialSelectedItem, itemToString],
  );

  const handleChange = useCallback(
    (data: { selectedItem?: StockBatchWithUoM | null }) => {
      onValueChange?.(data.selectedItem?.uuid ?? '');
    },
    [onValueChange],
  );

  if (isLoading) {
    return <SelectSkeleton role="progressbar" />;
  }

  return (
    <ComboBox
      id="stockBatchUuid"
      invalid={!!error}
      invalidText={error}
      items={filteredBatches}
      itemToString={itemToString}
      name="stockBatchUuid"
      onChange={handleChange}
      placeholder={t('filterPlaceholder', 'Filter...')}
      selectedItem={initialSelectedItem}
      shouldFilterItem={shouldFilterItem}
      style={{ flexGrow: 1 }}
      titleText={t('batchNo', 'Batch number')}
      translateWithId={comboBoxTranslateWithId(t)}
    />
  );
};

export default BatchNoSelector;
