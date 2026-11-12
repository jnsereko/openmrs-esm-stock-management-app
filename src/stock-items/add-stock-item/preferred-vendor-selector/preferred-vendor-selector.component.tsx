import React, { type ReactNode } from 'react';
import { type Control, Controller, type FieldValues } from 'react-hook-form';
import { ComboBox, TextInputSkeleton } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { useStockSources } from '../../../stock-sources/stock-sources.resource';
import { ResourceRepresentation } from '../../../core/api/api';
import { type StockSource } from '../../../core/api/types/stockOperation/StockSource';
import { comboBoxTranslateWithId } from '../../../core/utils/translations';

interface PreferredVendorSelectorProps<T> {
  onPreferredVendorChange?: (unit: StockSource | null | undefined) => void;
  title?: string;
  placeholder?: string;
  invalid?: boolean;
  invalidText?: ReactNode;

  // Control
  controllerName: string;
  name: string;
  control: Control<FieldValues, T>;
}

const PreferredVendorSelector = <T,>(props: PreferredVendorSelectorProps<T>) => {
  const { t } = useTranslation();
  const {
    items: { results: sourcesList },
    isLoading,
  } = useStockSources({
    v: ResourceRepresentation.Default,
  });

  if (isLoading) {
    return <TextInputSkeleton />;
  }

  return (
    <Controller
      name={props.controllerName}
      control={props.control}
      render={({ field: { onChange, value, ref } }) => (
        <ComboBox
          translateWithId={comboBoxTranslateWithId(t)}
          titleText={props.title}
          id={props.name}
          size={'md'}
          items={sourcesList || []}
          onChange={(data: { selectedItem: StockSource | null | undefined }) => {
            props.onPreferredVendorChange?.(data.selectedItem);
            onChange(data.selectedItem?.uuid);
          }}
          selectedItem={sourcesList?.find((p) => p.uuid === value) ?? null}
          itemToString={(item?: StockSource) => (item?.name ? item.name : '')}
          shouldFilterItem={() => true}
          placeholder={props.placeholder}
          ref={ref}
          invalid={props.invalid}
          invalidText={props.invalidText}
        />
      )}
    />
  );
};

export default PreferredVendorSelector;
