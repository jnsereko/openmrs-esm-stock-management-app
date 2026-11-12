import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DropdownSkeleton, MultiSelect } from '@carbon/react';
import { getStockOperationTypes, useConcept } from '../stock-lookups/stock-lookups.resource';
import { StockFilters } from '../constants';
import { StockOperationStatusTypes } from '../core/api/types/stockOperation/StockOperationStatus';
import styles from '../stock-items/stock-items-table.scss';
import { translateOperationStatus, comboBoxTranslateWithId } from '../core/utils/translations';

interface StockOperationFiltersProps {
  conceptUuid?: string;
  filterName: string;
  onFilterChange: (selectedItems: any[], filterType: string) => void;
}

const StockOperationsFilters: React.FC<StockOperationFiltersProps> = ({ conceptUuid, onFilterChange, filterName }) => {
  const { t } = useTranslation();
  const { items, isLoading } = useConcept(conceptUuid);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataItems, setDataItems] = useState([]);

  useEffect(() => {
    setIsDataLoading(true);
    switch (filterName) {
      case StockFilters.STATUS:
        setDataItems(
          StockOperationStatusTypes.map((option) => ({
            uuid: option,
            display: option,
          })),
        );
        break;
      case StockFilters.SOURCES:
        if (items?.answers?.length) {
          setDataItems([...items.answers]);
          setIsDataLoading(isLoading);
        }

        break;
      case StockFilters.OPERATION:
        getStockOperationTypes().then((response) => {
          setIsDataLoading(true);
          if (response.data?.results.length) {
            setDataItems(
              response.data.results.map((result) => ({
                uuid: result.uuid,
                display: result.name,
              })),
            );
          }

          setIsDataLoading(false);
        });
    }
    setIsDataLoading(false);
  }, [filterName, isLoading, items.answers]);

  if (isDataLoading) {
    return <DropdownSkeleton />;
  }

  // filterName is also the filter's identity (StockFilters); show its translation
  const filterLabel =
    filterName === StockFilters.SOURCES
      ? t('sources', 'Sources')
      : filterName === StockFilters.STATUS
      ? t('status', 'Status')
      : filterName === StockFilters.OPERATION
      ? t('operationFilter', 'Operation')
      : filterName;

  return (
    <MultiSelect
      translateWithId={comboBoxTranslateWithId(t)}
      autoAlign
      className={styles.filtersAlign}
      disabled={!dataItems.length}
      id="multiSelect"
      label={filterLabel}
      labelInline
      items={dataItems}
      itemToString={(item) =>
        item
          ? filterName === StockFilters.STATUS
            ? translateOperationStatus(t, item.display)
            : item.display
          : t('notSet', 'Not Set')
      }
      onChange={({ selectedItems }) => {
        if (selectedItems) {
          onFilterChange(
            selectedItems.map((selectedItem) => selectedItem.uuid),
            filterName,
          );
        }
      }}
      placeholder={t('filterBy', 'Filter by {{filterName}}', { filterName: filterLabel })}
    />
  );
};

export default StockOperationsFilters;
