import React, { useMemo, useState } from 'react';
import { ComboBox } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { useStockTagLocations } from '../../../../stock-lookups/stock-lookups.resource';
import { comboBoxTranslateWithId } from '../../../../core/utils/translations';

interface TransactionsLocationsFilterProps {
  /** The chosen location's uuid, or '' when all locations are wanted */
  onLocationIdChange?: (location: string) => void;
  /**
   * The chosen location's uuid, '' for « All locations », null for no choice yet (the placeholder shows).
   * The parent keeps it because the list below remounts this box while it reloads.
   */
  value?: string | null;
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
  const [chosenId, setChosenId] = useState<string | null>(null);

  // « All locations » is the way back to the unfiltered list, as in the Operations filters
  const items = useMemo<Array<LocationOption>>(
    () => [{ id: ALL_LOCATIONS_ID, name: t('allLocations', 'All locations') }, ...(stockLocations ?? [])],
    [stockLocations, t],
  );

  const currentId = props.value === undefined ? chosenId : props.value;
  const selected = currentId === null ? null : items.find((item) => item.id === currentId) ?? null;

  return (
    <ComboBox
      translateWithId={comboBoxTranslateWithId(t)}
      titleText={props.title}
      id={props.name}
      size={'md'}
      items={items}
      selectedItem={selected}
      onChange={({ selectedItem }: { selectedItem?: LocationOption | null }) => {
        const locationId = selectedItem?.id ?? ALL_LOCATIONS_ID;
        setChosenId(locationId);
        props.onLocationIdChange?.(locationId);
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
