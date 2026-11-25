import React, { useMemo, useState } from 'react';
import { ComboBox } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { useStockTagLocations } from '../../../../stock-lookups/stock-lookups.resource';
import { comboBoxTranslateWithId } from '../../../../core/utils/translations';

interface TransactionsLocationsFilterProps {
  /** The chosen location's uuid, or '' when all locations are wanted */
  onLocationIdChange?: (location: string) => void;
  title?: string;
  placeholder?: string;
  name: string;
}

interface LocationOption {
  id: string;
  name: string;
}

export const ALL_LOCATIONS_ID = '';

const TransactionsLocationsFilter: React.FC<TransactionsLocationsFilterProps> = (props) => {
  const { t } = useTranslation();
  const { stockLocations } = useStockTagLocations();
  const [selected, setSelected] = useState<LocationOption | null>(null);

  // « All locations » is the way back to the unfiltered list, as in the Operations filters
  const items = useMemo<Array<LocationOption>>(
    () => [{ id: ALL_LOCATIONS_ID, name: t('allLocations', 'All locations') }, ...(stockLocations ?? [])],
    [stockLocations, t],
  );

  return (
    <ComboBox
      translateWithId={comboBoxTranslateWithId(t)}
      titleText={props.title}
      id={props.name}
      size={'md'}
      items={items}
      selectedItem={selected}
      onChange={({ selectedItem }: { selectedItem?: LocationOption | null }) => {
        const location = selectedItem?.id ? selectedItem : null;
        setSelected(location);
        props.onLocationIdChange?.(location?.id ?? ALL_LOCATIONS_ID);
      }}
      itemToString={(item: LocationOption | null) => (item ? item.name : '')}
      shouldFilterItem={({ item, inputValue }) =>
        !inputValue || item.id === ALL_LOCATIONS_ID || item.name?.toLowerCase().includes(inputValue.toLowerCase())
      }
      placeholder={props.placeholder}
    />
  );
};

export default TransactionsLocationsFilter;
