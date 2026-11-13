import React, { useCallback, useMemo, useState } from 'react';
import {
  DataTable,
  DataTableSkeleton,
  DatePicker,
  DatePickerInput,
  InlineLoading,
  Link,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableExpandedRow,
  TableExpandHeader,
  TableExpandRow,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  TableToolbarAction,
  TableToolbarContent,
  TableToolbarMenu,
  TableToolbarSearch,
  Tile,
} from '@carbon/react';
import { ArrowRight } from '@carbon/react/icons';
import { useTranslation } from 'react-i18next';
import { isDesktop, restBaseUrl } from '@openmrs/esm-framework';
import { DATE_PICKER_CONTROL_FORMAT, DATE_PICKER_FORMAT, StockFilters } from '../constants';
import { formatListDate } from '../core/utils/datetimeUtils';
import { useHandleMutate } from '../utils';
import { useDebounce } from '../core/hooks/debounce-hook';
import { ResourceRepresentation } from '../core/api/api';
import { useStockOperationPages } from './stock-operations-table.resource';
import EditStockOperationActionMenu from './edit-stock-operation/edit-stock-operation-action-menu.component';
import StockOperationTypesSelector from './stock-operation-types-selector/stock-operation-types-selector.component';
import StockOperationsFilters from './stock-operations-filters.component';
import StockOperationExpandedRow from './add-stock-operation/stock-operations-expanded-row/stock-operation-expanded-row.component';
import styles from './stock-operations-table.scss';
import {
  dataTableTranslateWithId,
  datePickerLocale,
  datePickerMonthLabels,
  paginationTexts,
  tableHeaderTranslateWithId,
  translateOperationStatus,
} from '../core/utils/translations';

interface StockOperationsTableProps {
  status?: string;
}

const StockOperations: React.FC<StockOperationsTableProps> = () => {
  const { t, i18n } = useTranslation();
  const handleMutate = useHandleMutate();

  const handleRefresh = () => {
    handleMutate(`${restBaseUrl}/stockmanagement/stockoperation`);
  };

  const [selectedFromDate, setSelectedFromDate] = useState(null);
  const [selectedToDate, setSelectedToDate] = useState(null);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedOperations, setSelectedOperations] = useState<string[]>([]);
  // The search runs on the server, which pages the operations; DataTable's own search only looked at
  // the page shown, in cells that hold buttons rather than text, and found nothing (#636)
  const [searchInput, setSearchInput] = useState('');
  const [searchText, setSearchText] = useState('');
  // The expanded rows are kept here rather than in DataTable: DataTable keeps a row open across a
  // filter change and, for one render, still lists the old rows against the new page of operations,
  // so the opened row was handed no operation and the page crashed (« Autorisé » filter, #632)
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);
  const collapseAllRows = useCallback(() => setExpandedRowIds([]), []);
  const toggleRow = useCallback(
    (rowId: string) =>
      setExpandedRowIds((ids) => (ids.includes(rowId) ? ids.filter((id) => id !== rowId) : [...ids, rowId])),
    [],
  );

  const debouncedSearch = useDebounce((query: string) => {
    collapseAllRows();
    setSearchText(query.trim());
  }, 300);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement> | string) => {
    const query = typeof event === 'string' ? event : event?.target?.value ?? '';
    setSearchInput(query);
    debouncedSearch(query);
  };

  const { items, tableHeaders, currentPage, pageSizes, totalItems, goTo, currentPageSize, setPageSize, isLoading } =
    useStockOperationPages({
      v: ResourceRepresentation.Full,
      totalCount: true,
      // The server matches the start of the operation number, or the name of its source or destination
      q: searchText || undefined,
      operationDateMin: selectedFromDate?.toISOString(),
      operationDateMax: selectedToDate?.toISOString(),
      status: selectedStatus.join(','),
      sourceTypeUuid: selectedSources.join(','),
      operationTypeUuid: selectedOperations.join(','),
    });

  const filterApplied =
    searchText ||
    selectedFromDate ||
    selectedToDate ||
    selectedSources.length ||
    selectedStatus.length ||
    selectedOperations.length;

  const handleOnFilterChange = useCallback(
    (selectedItems, filterType) => {
      collapseAllRows();
      if (filterType === StockFilters.SOURCES) {
        setSelectedSources(selectedItems);
      } else if (filterType === StockFilters.OPERATION) {
        setSelectedOperations(selectedItems);
      } else {
        setSelectedStatus(selectedItems);
      }
    },
    [collapseAllRows],
  );

  const handleDateFilterChange = ([startDate, endDate]) => {
    collapseAllRows();
    if (startDate) {
      setSelectedFromDate(startDate);
      if (selectedToDate && startDate && selectedToDate < startDate) {
        setSelectedToDate(startDate);
      }
    }
    if (endDate) {
      setSelectedToDate(endDate);
      if (selectedFromDate && endDate && selectedFromDate > endDate) {
        setSelectedFromDate(endDate);
      }
    }
  };

  const tableRows = useMemo(
    () =>
      items?.map((stockOperation, index) => {
        const threshHold = 1;
        const itemCountGreaterThanThreshhold = (stockOperation?.stockOperationItems?.length ?? 0) > threshHold;
        const commonNames =
          stockOperation?.stockOperationItems
            ?.slice(0, itemCountGreaterThanThreshhold ? threshHold : undefined)
            .map((item) => item.commonName)
            .join(', ') ?? '';

        return {
          ...stockOperation,
          id: stockOperation?.uuid,
          key: `key-${stockOperation?.uuid}`,
          operationTypeName: `${stockOperation?.operationTypeName}`,
          operationNumber: (
            <EditStockOperationActionMenu stockOperation={stockOperation} showIcon={false} showprops={true} />
          ),
          stockOperationItems: {
            commonNames,
            more: itemCountGreaterThanThreshhold ? stockOperation?.stockOperationItems?.length - threshHold : 0,
          },
          status: translateOperationStatus(t, stockOperation?.status),
          source: `${stockOperation?.sourceName ?? ''}`,
          destination: `${stockOperation?.destinationName ?? ''}`,
          location: (
            <>
              {stockOperation?.sourceName ?? ''}
              {stockOperation?.sourceName && stockOperation?.destinationName ? (
                <ArrowRight className={styles.arrowIcon} key={`${index}-0`} size={12} />
              ) : (
                ''
              )}{' '}
              {stockOperation?.destinationName ?? ''}
            </>
          ),
          responsiblePerson: `${
            stockOperation?.responsiblePersonFamilyName ?? stockOperation?.responsiblePersonOther ?? ''
          } ${stockOperation?.responsiblePersonGivenName ?? ''}`,
          operationDate: formatListDate(stockOperation?.operationDate),
          actions: <EditStockOperationActionMenu stockOperation={stockOperation} showIcon={true} showprops={false} />,
        };
      }),
    [items, t],
  );

  if (isLoading && !filterApplied) {
    return (
      <DataTableSkeleton className={styles.dataTableSkeleton} showHeader={false} rowCount={5} columnCount={5} zebra />
    );
  }

  return (
    <>
      <h2 className={styles.tableHeader}>
        {t('stockOperationsTableHeader', 'Stock operations to track movement of stock.')}
      </h2>
      <DataTable
        headers={tableHeaders}
        isSortable
        rows={tableRows}
        useZebraStyles
        translateWithId={dataTableTranslateWithId(t)}
      >
        {({ getExpandedRowProps, getHeaderProps, getRowProps, getTableProps, headers, rows }) => (
          <TableContainer className={styles.stockTableContainer}>
            <TableToolbar
              aria-label={t('dataTableToolbar', 'Data table toolbar')}
              style={{
                position: 'static',
                overflow: 'visible',
                backgroundColor: 'color',
              }}
            >
              <TableToolbarContent className={styles.toolbarContent}>
                <TableToolbarSearch
                  expanded
                  closeButtonLabelText={t('clearSearch', 'Clear search input')}
                  labelText={t('searchStockOperationsByNumber', 'Search by operation number or location')}
                  onChange={handleSearchChange}
                  placeholder={t('searchStockOperationsByNumber', 'Search by operation number or location')}
                  value={searchInput}
                />
                <div className={styles.container}>
                  <DatePicker
                    className={styles.datePicker}
                    datePickerType="range"
                    dateFormat={DATE_PICKER_CONTROL_FORMAT}
                    locale={datePickerLocale(i18n.language)}
                    {...datePickerMonthLabels(t)}
                    onChange={([startDate, endDate]) => handleDateFilterChange([startDate, endDate])}
                    value={[selectedFromDate, selectedToDate]}
                  >
                    <DatePickerInput
                      id="stock-operations-start-date"
                      labelText={t('startDate', 'Start date')}
                      placeholder={DATE_PICKER_FORMAT}
                    />
                    <DatePickerInput
                      id="stock-operations-end-date"
                      labelText={t('endDate', 'End date')}
                      placeholder={DATE_PICKER_FORMAT}
                    />
                  </DatePicker>
                  <StockOperationsFilters filterName={StockFilters.SOURCES} onFilterChange={handleOnFilterChange} />
                  <StockOperationsFilters filterName={StockFilters.STATUS} onFilterChange={handleOnFilterChange} />
                  <StockOperationsFilters filterName={StockFilters.OPERATION} onFilterChange={handleOnFilterChange} />
                </div>
                <TableToolbarMenu iconDescription={t('settings', 'Settings')}>
                  <TableToolbarAction className={styles.toolbarMenuAction} onClick={handleRefresh}>
                    {t('refresh', 'Refresh')}
                  </TableToolbarAction>
                </TableToolbarMenu>

                <StockOperationTypesSelector />
              </TableToolbarContent>
            </TableToolbar>
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  <TableExpandHeader />
                  {headers.map(
                    (header: any) =>
                      header.key !== 'details' && (
                        <TableHeader
                          {...getHeaderProps({
                            header,
                            isSortable: header.isSortable,
                          })}
                          className={isDesktop ? styles.desktopHeader : styles.tabletHeader}
                          key={`${header.key}`}
                          translateWithId={tableHeaderTranslateWithId(t)}
                        >
                          {header.header?.content ?? header.header}
                        </TableHeader>
                      ),
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows?.map((row: any) => {
                  const model = items?.find((item) => item?.uuid === row.id);
                  const isExpanded = Boolean(model) && expandedRowIds.includes(row.id);
                  const props = {
                    ...getRowProps({ row }),
                    isExpanded,
                    onExpand: () => toggleRow(row.id),
                    'aria-label': isExpanded
                      ? t('collapseCurrentRow', 'Collapse current row')
                      : t('expandCurrentRow', 'Expand current row'),
                  };
                  return (
                    <React.Fragment key={row.id}>
                      <TableExpandRow className={isDesktop ? styles.desktopRow : styles.tabletRow} {...props}>
                        {row.cells.map((cell) => (
                          <TableCell
                            key={cell.id}
                            className={cell?.info?.header === 'stockOperationItems' ? styles.itemNamesCell : undefined}
                          >
                            {cell?.info?.header === 'stockOperationItems' ? (
                              <span>
                                <span>{cell.value.commonNames}</span>
                                {cell.value.more > 0 && (
                                  <Link onClick={() => toggleRow(row.id)}>
                                    {t('moreItems', '...({{count}} more)', { count: cell.value.more })}
                                  </Link>
                                )}
                              </span>
                            ) : (
                              cell.value
                            )}
                          </TableCell>
                        ))}
                      </TableExpandRow>
                      {isExpanded ? (
                        <TableExpandedRow {...getExpandedRowProps({ row })} colSpan={headers.length + 1}>
                          <StockOperationExpandedRow model={model} />
                        </TableExpandedRow>
                      ) : (
                        <TableExpandedRow className={styles.hiddenRow} colSpan={headers.length + 1} />
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
            {rows.length === 0 && !isLoading ? (
              <div className={styles.tileContainer}>
                <Tile className={styles.tile}>
                  <div className={styles.tileContent}>
                    <p className={styles.content}>{t('noOperationsToDisplay', 'No stock operations to display')}</p>
                    <p className={styles.helper}>{t('checkFilters', 'Check the filters above')}</p>
                  </div>
                </Tile>
              </div>
            ) : null}
            {Boolean(filterApplied && isLoading) && (
              <div className={styles.rowLoadingContainer}>
                <InlineLoading description={t('loadingPlaceholder', 'Loading...')} />
              </div>
            )}
          </TableContainer>
        )}
      </DataTable>
      {items.length > 0 && (
        <Pagination
          {...paginationTexts(t)}
          page={currentPage}
          pageSize={currentPageSize}
          pageSizes={pageSizes}
          totalItems={totalItems}
          onChange={({ pageSize, page }) => {
            if (pageSize !== currentPageSize) {
              setPageSize(pageSize);
            }
            if (page !== currentPage) {
              goTo(page);
            }
          }}
          className={styles.paginationOverride}
        />
      )}
    </>
  );
};

export default StockOperations;
