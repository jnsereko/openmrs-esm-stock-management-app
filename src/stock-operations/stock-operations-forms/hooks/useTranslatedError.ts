import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * The form schema (validation-schema.ts) is built without a translation function, so its messages are
 * English. Translate the ones the operation details step can show.
 */
const useTranslatedError = () => {
  const { t } = useTranslation();
  return useCallback(
    (message?: string) => {
      switch (message) {
        case 'Responsible Person Required':
          return t('responsiblePersonRequired', 'Responsible Person Required');
        case 'Location Required':
          return t('operationLocationRequired', 'Location Required');
        case 'Destination Required':
          return t('destinationRequired', 'Destination Required');
        case 'You must add atleast one stock item':
          return t('atLeastOneStockItem', 'You must add at least one stock item');
        case 'Source Required':
          return t('sourceRequired', 'Source Required');
        case 'Reason Required':
          return t('reasonRequired', 'Reason Required');
        default:
          return message;
      }
    },
    [t],
  );
};

export default useTranslatedError;
