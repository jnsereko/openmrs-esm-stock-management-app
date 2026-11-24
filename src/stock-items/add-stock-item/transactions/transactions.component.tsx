import { Button, DataTableSkeleton, DatePicker, DatePickerInput } from '@carbon/react';
import { ArrowLeft } from '@carbon/react/icons';
import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { type StockItemInventoryFilter } from '../../stock-items.resource';
import TransactionsPrintAction from './printout/transactions-print-action.component';
import TransactionsLocationsFilter from './transaction-filters/transaction-locations-filter.component';
import { toTransactionPeriod, useStockItemsTransactions } from './transactions.resource';
import StockOperationReference from '../../../stock-operations/stock-operation-reference.component';

interface TransactionsProps {
  onSubmit?: () => void;
  stockItemUuid: string;
}

const Transactions: React.FC<TransactionsProps> = ({ stockItemUuid }) => {
  const { t, i18n } = useTranslation();
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  const [stockItemFilter, setStockItemFilter] = useState<StockItemInventoryFilter>();
  const {
    isLoading,
    items,
    tableHeaders,
    totalCount,
    setCurrentPage,
    setStockItemUuid,
    setLocationUuid,
    setPeriod,
    binCardHeaders,
    inventory,
  } = useStockItemsTransactions(stockItemFilter);

  useEffect(() => {
    setStockItemUuid(stockItemUuid);
  }, [stockItemUuid, setStockItemUuid]);

  const { control } = useForm({});

  const tableRows = useMemo(() => {
    return items?.map((stockItemTransaction) => {
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
    });
  }, [items, inventory, t]);

  const changePeriod = (from: Date | null, to: Date | null) => {
    setFromDate(from);
    setToDate(to);
    setPeriod(from, to);
    // The bin card prints what is shown: the same period
    setStockItemFilter((previous) => ({ ...previous, ...toTransactionPeriod(from, to) }));
  };

  if (isLoading) {
    return <DataTableSkeleton role="progressbar" />;
  }

  return (
    <DataList
      children={() => (
        <>
          <TransactionsPrintAction
            columns={binCardHeaders}
            data={tableRows}
            itemUuid={stockItemUuid}
            filter={stockItemFilter}
          />
          <TransactionsLocationsFilter
            onLocationIdChange={(q) => {
              setLocationUuid(q);
              setStockItemFilter((previous) => ({ ...previous, locationUuid: q }));
            }}
            name={'TransactionLocationUuid'}
            placeholder={t('filterByLocation', 'Filter by Location')}
            control={control}
            controllerName="TransactionLocationUuid"
          />
          <DatePicker
            datePickerType="range"
            dateFormat={DATE_PICKER_CONTROL_FORMAT}
            locale={datePickerLocale(i18n.language)}
            {...datePickerMonthLabels(t)}
            onChange={(dates: Date[]) => changePeriod(dates?.[0] ?? null, dates?.[1] ?? null)}
            value={[fromDate, toDate]}
          >
            <DatePickerInput
              id="transactions-start-date"
              labelText={t('startDate', 'Start date')}
              placeholder={DATE_PICKER_FORMAT}
            />
            <DatePickerInput
              id="transactions-end-date"
              labelText={t('endDate', 'End date')}
              placeholder={DATE_PICKER_FORMAT}
            />
          </DatePicker>
          {(fromDate || toDate) && (
            <Button kind="ghost" size="md" onClick={() => changePeriod(null, null)}>
              {t('clearDates', 'Clear dates')}
            </Button>
          )}
        </>
      )}
      columns={tableHeaders}
      data={tableRows}
      totalItems={totalCount}
      goToPage={setCurrentPage}
      hasToolbar={true}
    />
  );
};

export default Transactions;
