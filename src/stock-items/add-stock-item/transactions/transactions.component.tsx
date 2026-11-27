import { Button, DataTableSkeleton, DatePicker, DatePickerInput } from '@carbon/react';
import { ArrowLeft } from '@carbon/react/icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DataList from '../../../core/components/table/table.component';
import {
  DATE_PICKER_CONTROL_FORMAT,
  DATE_PICKER_FORMAT,
  formatExpiryDate,
  formatListDate,
} from '../../../core/utils/datetimeUtils';
import {
  datePickerLocale,
  datePickerMonthLabels,
  translateOperationStatus,
  translateOperationTypeName,
} from '../../../core/utils/translations';
import { ResourceRepresentation } from '../../../core/api/api';
import { type StockItemInventoryFilter } from '../../stock-items.resource';
import TransactionsPrintAction from './printout/transactions-print-action.component';
import TransactionsLocationsFilter from './transaction-filters/transaction-locations-filter.component';
import {
  fetchPrintTransactions,
  parseTypedDate,
  toTransactionPeriod,
  useStockItemsTransactions,
} from './transactions.resource';
import styles from './transactions.scss';
import StockOperationReference from '../../../stock-operations/stock-operation-reference.component';

interface TransactionsProps {
  onSubmit?: () => void;
  stockItemUuid: string;
  /** The period shown first (the Rapports view opens on the current month); none on the item's tab */
  defaultPeriod?: { from: Date | null; to: Date | null };
  /** The location box's first value: '' shows « All locations »; null (the item's tab) shows the placeholder */
  defaultLocationId?: string | null;
}

const Transactions: React.FC<TransactionsProps> = ({ stockItemUuid, defaultPeriod, defaultLocationId = null }) => {
  const { t, i18n } = useTranslation();
  const [fromDate, setFromDate] = useState<Date | null>(defaultPeriod?.from ?? null);
  const [toDate, setToDate] = useState<Date | null>(defaultPeriod?.to ?? null);

  // Kept here: the list below remounts the filters while it reloads, which used to blank the location box
  const [locationId, setLocationId] = useState<string | null>(defaultLocationId);

  const [stockItemFilter, setStockItemFilter] = useState<StockItemInventoryFilter>(() =>
    defaultPeriod ? { stockItemUuid, ...toTransactionPeriod(defaultPeriod.from, defaultPeriod.to) } : undefined,
  );
  const {
    isLoading,
    items,
    tableHeaders,
    totalCount,
    setCurrentPage,
    setStockItemUuid,
    setLocationUuid,
    setPeriod,
    currentPage,
    currentPageSize,
    setPageSize,
    binCardHeaders,
    inventory,
    transactionFilter,
  } = useStockItemsTransactions(stockItemFilter);

  useEffect(() => {
    setStockItemUuid(stockItemUuid);
  }, [stockItemUuid, setStockItemUuid]);

  const toRow = useCallback(
    (stockItemTransaction) => {
      const balance = inventory?.total ?? '';

      return {
        ...stockItemTransaction,
        id: stockItemTransaction?.uuid,
        key: `key-${stockItemTransaction?.uuid}`,
        uuid: `${stockItemTransaction?.uuid}`,
        date: formatListDate(stockItemTransaction?.dateCreated),
        location:
          stockItemTransaction.operationSourcePartyName && stockItemTransaction.operationDestinationPartyName ? (
            stockItemTransaction.operationSourcePartyName === stockItemTransaction?.partyName ? (
              stockItemTransaction.quantity > 0 ? (
                <>
                  <span className="transaction-location">{stockItemTransaction.operationSourcePartyName}</span>
                  <ArrowLeft size={16} /> {stockItemTransaction.operationDestinationPartyName}
                </>
              ) : (
                <>
                  <span className="transaction-location">{stockItemTransaction.operationSourcePartyName}</span>
                  <ArrowLeft size={16} /> {stockItemTransaction.operationDestinationPartyName}
                </>
              )
            ) : stockItemTransaction.operationDestinationPartyName === stockItemTransaction?.partyName ? (
              stockItemTransaction.quantity > 0 ? (
                <>
                  <span className="transaction-location">{stockItemTransaction.operationDestinationPartyName}</span>
                  <ArrowLeft size={16} /> {stockItemTransaction.operationSourcePartyName}
                </>
              ) : (
                <>
                  <span className="transaction-location">{stockItemTransaction.operationDestinationPartyName}</span>
                  <ArrowLeft size={16} /> {stockItemTransaction.operationSourcePartyName}
                </>
              )
            ) : (
              stockItemTransaction?.partyName
            )
          ) : (
            stockItemTransaction?.partyName
          ),
        transaction: stockItemTransaction?.isPatientTransaction
          ? t('patientDispense', 'Patient Dispense')
          : translateOperationTypeName(t, stockItemTransaction.stockOperationTypeName),
        quantity: `${stockItemTransaction?.quantity?.toLocaleString()} ${stockItemTransaction?.packagingUomName ?? ''}`,
        batch: stockItemTransaction.stockBatchNo
          ? `${stockItemTransaction.stockBatchNo}${
              stockItemTransaction.expiration ? ` (${formatExpiryDate(stockItemTransaction.expiration)})` : ''
            }`
          : '',
        reference: (
          <StockOperationReference
            operationUuid={stockItemTransaction?.stockOperationUuid}
            operationNumber={stockItemTransaction?.stockOperationNumber}
          />
        ),
        status: translateOperationStatus(t, stockItemTransaction?.stockOperationStatus) ?? '',
        in:
          stockItemTransaction?.quantity >= 0
            ? t('transactionQuantity', '{{quantity}} {{unit}} of {{factor}}', {
                quantity: stockItemTransaction?.quantity?.toLocaleString(),
                unit: stockItemTransaction?.packagingUomName ?? '',
                factor: stockItemTransaction.packagingUomFactor,
                interpolation: { escapeValue: false },
              })
            : '',
        out:
          stockItemTransaction?.quantity < 0
            ? t('transactionQuantity', '{{quantity}} {{unit}} of {{factor}}', {
                quantity: (-1 * stockItemTransaction?.quantity)?.toLocaleString(),
                unit: stockItemTransaction?.packagingUomName ?? '',
                factor: stockItemTransaction.packagingUomFactor,
                interpolation: { escapeValue: false },
              })
            : '',
        totalin:
          stockItemTransaction?.quantity >= 0
            ? `${stockItemTransaction?.quantity * Number(stockItemTransaction.packagingUomFactor)}`
            : '',
        totalout:
          stockItemTransaction?.quantity < 0
            ? `${-1 * stockItemTransaction?.quantity * Number(stockItemTransaction.packagingUomFactor)}`
            : '',
        balance: `${balance} ${stockItemTransaction?.packagingUomName ?? ''}`,
      };
    },
    [inventory, t],
  );

  const tableRows = useMemo(() => items?.map(toRow), [items, toRow]);

  // The bin card prints every movement of the filtered list, not only the page shown
  const getPrintRows = useCallback(async () => {
    const { rows, truncated } = await fetchPrintTransactions(transactionFilter);
    return { rows: rows.map(toRow), truncated };
  }, [transactionFilter, toRow]);

  // The stock card lists the patient dispenses of this item, in the same location and period
  const getStockCardRows = useCallback(
    () =>
      fetchPrintTransactions({ ...transactionFilter, isPatientTransaction: 'true', v: ResourceRepresentation.Full }),
    [transactionFilter],
  );

  const changePeriod = (from: Date | null, to: Date | null) => {
    setFromDate(from);
    setToDate(to);
    setPeriod(from, to);
    // The bin card prints what is shown: the same period
    setStockItemFilter((previous) => ({ ...previous, ...toTransactionPeriod(from, to) }));
  };

  // A day typed in a box does not always reach the picker's onChange: read both boxes when one is left
  const syncTypedPeriod = () => {
    const from = parseTypedDate((document.getElementById('transactions-start-date') as HTMLInputElement)?.value);
    const to = parseTypedDate((document.getElementById('transactions-end-date') as HTMLInputElement)?.value);
    const day = (date: Date | null) => (date ? date.getTime() : null);
    if (day(from) !== day(fromDate) || day(to) !== day(toDate)) {
      changePeriod(from, to);
    }
  };

  if (isLoading) {
    return <DataTableSkeleton role="progressbar" />;
  }

  return (
    <DataList
      children={() => (
        <>
          <div className={styles.filters}>
            <TransactionsPrintAction
              columns={binCardHeaders}
              data={tableRows}
              itemUuid={stockItemUuid}
              filter={stockItemFilter}
              getPrintRows={getPrintRows}
              getStockCardRows={getStockCardRows}
            />
            <TransactionsLocationsFilter
              value={locationId}
              onLocationIdChange={(q) => {
                setLocationId(q);
                setLocationUuid(q);
                setStockItemFilter((previous) => ({ ...previous, locationUuid: q }));
              }}
              name={'TransactionLocationUuid'}
              placeholder={t('filterByLocation', 'Filter by Location')}
            />
            <DatePicker
              datePickerType="range"
              dateFormat={DATE_PICKER_CONTROL_FORMAT}
              locale={datePickerLocale(i18n.language)}
              {...datePickerMonthLabels(t)}
              onChange={(dates: Date[]) => changePeriod(dates?.[0] ?? null, dates?.[1] ?? null)}
              onClose={syncTypedPeriod}
              value={[fromDate, toDate]}
            >
              <DatePickerInput
                id="transactions-start-date"
                onBlur={syncTypedPeriod}
                labelText={t('startDate', 'Start date')}
                placeholder={DATE_PICKER_FORMAT}
              />
              <DatePickerInput
                id="transactions-end-date"
                onBlur={syncTypedPeriod}
                labelText={t('endDate', 'End date')}
                placeholder={DATE_PICKER_FORMAT}
              />
            </DatePicker>
            {(fromDate || toDate) && (
              <Button kind="ghost" size="md" onClick={() => changePeriod(null, null)}>
                {t('clearDates', 'Clear dates')}
              </Button>
            )}
          </div>
        </>
      )}
      columns={tableHeaders}
      data={tableRows}
      totalItems={totalCount}
      goToPage={setCurrentPage}
      page={currentPage}
      pageSize={currentPageSize}
      onPageSizeChange={setPageSize}
      hasToolbar={true}
    />
  );
};

export default Transactions;
