import React from 'react';
import { type Control, Controller, type FieldValues } from 'react-hook-form';
import { ComboBox, type ComboBoxProps } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { comboBoxTranslateWithId } from '../../utils/translations';

interface ControlledComboBoxProps<T, ItemType>
  extends Omit<ComboBoxProps<ItemType>, 'onChange' | 'id' | 'ref' | 'value'> {
  controllerName: string;
  name: string;
  control: Control<FieldValues, T>;
  onChange?: (e: { selectedItem: ItemType | null | undefined }) => void;
}

const ControlledComboBox = <T, ItemType = unknown>(props: ControlledComboBoxProps<T, ItemType>) => {
  const { t } = useTranslation();
  const { controllerName, name, control, onChange: onChangeProp, ...comboBoxProps } = props;

  return (
    <Controller
      name={controllerName}
      control={control}
      render={({ field: { onChange, value, ref } }) => (
        <ComboBox
          translateWithId={comboBoxTranslateWithId(t)}
          {...comboBoxProps}
          onChange={(e: { selectedItem: ItemType | null | undefined }) => {
            onChange(e.selectedItem);

            // Fire prop change
            if (onChangeProp) {
              onChangeProp(e);
            }
          }}
          id={name}
          ref={ref}
          value={value}
        />
      )}
    />
  );
};

export default ControlledComboBox;
