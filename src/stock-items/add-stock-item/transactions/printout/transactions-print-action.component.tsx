import React, { useMemo, useState } from 'react';
import { ComboButton, MenuItem } from '@carbon/react';
import { Printer } from '@carbon/react/icons';
import { useTranslation } from 'react-i18next';
import { useStockItem, useStockItemInventory } from '../../../stock-items.resource';
import { showModal, useConfig } from '@openmrs/esm-framework';
import { type StockItemInventoryFilter } from '../../../stock-items.resource';
import { ResourceRepresentation } from '../../../../core/api/api';
import { type ConfigObject } from '../../../../config-schema';

type Props = {
  itemUuid: string;
  columns: any;
  data: any;
  filter?: StockItemInventoryFilter;
  /** Every row of the filtered list for the bin card; the current page (`data`) when absent or when it fails */
  getPrintRows?: () => Promise<{ rows: Array<any>; truncated?: boolean }>;
  /** Every patient dispense of the item in the filtered location and period, for the stock card */
  getStockCardRows?: () => Promise<{ rows: Array<any>; truncated?: boolean }>;
};

const TransactionsPrintAction: React.FC<Props> = ({ columns, data, itemUuid, filter, getPrintRows, getStockCardRows }) => {
  const { t } = useTranslation();

  const { enablePrintButton } = useConfig<ConfigObject>();

  const [stockItemFilter] = useState<StockItemInventoryFilter>({
    startIndex: 0,
    v: filter?.v || ResourceRepresentation.Default,
    limit: 10,
    q: filter?.q,
    totalCount: true,
    stockItemUuid: itemUuid,
  });

  const { item: stockItem, isLoading: isStockItemLoading } = useStockItem(itemUuid);
  const { items: inventoryBalance } = useStockItemInventory(stockItemFilter);

  // The stock card is of one item: its stock now, in its own unit
  const stockCardBalance = (row: { packagingUomName?: string }) =>
    `${inventoryBalance?.total ?? ''} ${row?.packagingUomName ?? ''}`.trim();

  const stockCardHeaders = useMemo(
    () => [
      {
        key: 'patientId',
        header: 'Patient ID',
      },
      {
        key: 'patientName',
        header: 'Patient Name',
      },
      {
        key: 'patientIdentifier',
        header: 'Patient Identifier',
      },
      {
        key: 'date',
        header: 'Date',
      },
      {
        key: 'location',
        header: 'Location',
      },
      {
        key: 'transaction',
        header: 'Transaction',
      },
      {
        key: 'balance',
        header: 'Balance',
      },
      {
        key: 'totalout',
        header: 'OUT',
      },
      {
        key: 'batch',
        header: 'Batch',
      },
    ],
    [],
  );

  const [isPreparing, setIsPreparing] = useState(false);

  const handleBincardClick = async () => {
    setIsPreparing(true);
    let rows = data;
    let truncated = false;
    try {
      const printed = await getPrintRows?.();
      rows = printed?.rows ?? data;
      truncated = !!printed?.truncated;
    } catch {
      rows = data;
    } finally {
      setIsPreparing(false);
    }
    const dispose = showModal('transactions-print-bincard-preview-modal', {
      onClose: () => dispose(),
      title: stockItem?.drugName || stockItem?.conceptName || '',
      columns,
      data: rows,
      truncated,
    });
  };

  const handleStockcardClick = async () => {
    setIsPreparing(true);
    let rows = [];
    let truncated = false;
    try {
      const printed = await getStockCardRows?.();
      rows = printed?.rows ?? [];
      truncated = !!printed?.truncated;
    } catch {
      rows = [];
    } finally {
      setIsPreparing(false);
    }
    const dispose = showModal('transactions-print-stockcard-preview-modal', {
      onClose: () => dispose(),
      title: stockItem?.drugName || stockItem?.conceptName || '',
      columns: stockCardHeaders,
      data: rows.map((transaction) => ({ ...transaction, balance: stockCardBalance(transaction) })),
      truncated,
    });
  };

  return (
    <>
      {enablePrintButton && (
        <ComboButton label={t('print', 'Print')}>
          <MenuItem
            label={t('printStockCard', 'Print Stock Card')}
            renderIcon={(props) => <Printer size={24} {...props} />}
            onClick={handleStockcardClick}
            disabled={isStockItemLoading || isPreparing}
          />
          <MenuItem
            label={t('printBinCard', 'Print Bin Card')}
            renderIcon={(props) => <Printer size={24} {...props} />}
            onClick={handleBincardClick}
            disabled={isStockItemLoading || isPreparing}
          />
        </ComboButton>
      )}
    </>
  );
};

export default TransactionsPrintAction;
