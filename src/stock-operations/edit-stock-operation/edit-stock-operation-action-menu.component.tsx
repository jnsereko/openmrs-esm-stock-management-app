import React, { useCallback, useEffect, useMemo } from 'react';
import { Button, InlineLoading } from '@carbon/react';
import { Edit, View } from '@carbon/react/icons';
import { showSnackbar } from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';
import { type StockOperationDTO } from '../../core/api/types/stockOperation/StockOperationDTO';
import { isStockOperationEditable, launchStockoperationAddOrEditWorkSpace } from '../stock-operation.utils';
import { useStockOperationAndItems } from '../stock-operations.resource';
import useFilteredOperationTypesByRoles from '../stock-operations-forms/hooks/useFilteredOperationTypesByRoles';
import styles from './edit-stock-operation-button.scss';

interface EditStockOperationActionMenuProps {
  stockOperation: StockOperationDTO;
  showIcon?: boolean;
  showprops?: boolean;
}
const EditStockOperationActionMenu: React.FC<EditStockOperationActionMenuProps> = ({
  stockOperation: _stockOperation,
  showIcon = true,
  showprops = true,
}) => {
  const { t } = useTranslation();

  const {
    error: operationTypesError,
    isLoading: isOperationTypesLoading,
    operationTypes,
  } = useFilteredOperationTypesByRoles();

  const {
    isLoading: isStockOperationLoading,
    items: fetchedStockOperation,
    error: stockOperationError,
  } = useStockOperationAndItems(_stockOperation?.uuid);

  const activeOperationType = useMemo(
    () => operationTypes?.find((op) => op?.uuid === fetchedStockOperation?.operationTypeUuid),
    [operationTypes, fetchedStockOperation],
  );

  const handleLaunchWorkspace = useCallback(() => {
    launchStockoperationAddOrEditWorkSpace(
      activeOperationType,
      fetchedStockOperation,
      fetchedStockOperation?.requisitionStockOperationUuid,
    );
  }, [activeOperationType, fetchedStockOperation]);

  useEffect(() => {
    if (operationTypesError || stockOperationError) {
      showSnackbar({
        kind: 'error',
        title: t('stockOperationLoadError', 'Error loading stock operation'),
        subtitle: operationTypesError?.message || stockOperationError?.message || '',
      });
    }
  }, [operationTypesError, stockOperationError, t]);

  // The pencil said « Edit » on operations that open as « View » (#638)
  const isEditable = isStockOperationEditable(fetchedStockOperation ?? _stockOperation);

  if (isOperationTypesLoading || isStockOperationLoading) {
    return <InlineLoading status="active" iconDescription="Loading" />;
  }

  if (operationTypesError || stockOperationError) {
    return <>--</>;
  }

  return (
    <Button
      className={styles.editStockButton}
      kind="ghost"
      size="sm"
      onClick={handleLaunchWorkspace}
      renderIcon={showIcon ? () => (isEditable ? <Edit size={16} /> : <View size={16} />) : undefined}
      // The pencil alone had no name for screen readers
      aria-label={showprops ? undefined : isEditable ? t('edit', 'Edit') : t('view', 'View')}
    >
      {showprops && (
        <span className={styles.operationNumberText}>
          {/* Allow a line break after each « - » (SIS-0054-20261112135338) so a long number wraps in its column */}
          {fetchedStockOperation?.operationNumber?.split('-').map((part, index, parts) => (
            <React.Fragment key={index}>
              {part}
              {index < parts.length - 1 && (
                <>
                  -<wbr />
                </>
              )}
            </React.Fragment>
          ))}
        </span>
      )}
    </Button>
  );
};

export default EditStockOperationActionMenu;
