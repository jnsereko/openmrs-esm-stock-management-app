import React, { useCallback, useEffect } from 'react';
import { ButtonSkeleton, OverflowMenu, OverflowMenuItem } from '@carbon/react';
import { OverflowMenuVertical } from '@carbon/react/icons';
import { useTranslation } from 'react-i18next';
import { showSnackbar } from '@openmrs/esm-framework';
import { OperationType, type StockOperationType } from '../../core/api/types/stockOperation/StockOperationType';
import { launchStockoperationAddOrEditWorkSpace } from '../stock-operation.utils';
import useFilteredOperationTypesByRoles from '../stock-operations-forms/hooks/useFilteredOperationTypesByRoles';
import { translateOperationTypeName } from '../../core/utils/translations';

const StockOperationTypesSelector = () => {
  const { t } = useTranslation();
  const { error, isLoading, operationTypes } = useFilteredOperationTypesByRoles();

  const handleSelect = useCallback((stockOperationType: StockOperationType) => {
    const isStockIssueOperation = stockOperationType.operationType === OperationType.STOCK_ISSUE_OPERATION_TYPE;

    launchStockoperationAddOrEditWorkSpace(stockOperationType, undefined);
  }, []);

  useEffect(() => {
    if (error) {
      showSnackbar({
        kind: 'error',
        title: t('stockOperationTypesError', 'Error loading stock operation types'),
        subtitle: error?.message,
      });
    }
  }, [error, t]);

  if (isLoading) return <ButtonSkeleton />;

  if (error) return null;

  return operationTypes && operationTypes.length ? (
    <OverflowMenu
      // Carbon labels the button « Options » otherwise
      aria-label={t('startNew', 'Start New')}
      iconDescription={t('startNew', 'Start New')}
      renderIcon={() => (
        <>
          {t('startNew', 'Start New')}&nbsp;&nbsp;
          <OverflowMenuVertical size={16} />
        </>
      )}
      menuOffset={{ top: 0, left: -100 }}
      style={{
        backgroundColor: '#007d79',
        backgroundImage: 'none',
        color: '#fff',
        minHeight: '1rem',
        padding: '.95rem !important',
        width: 'auto',
        paddingInline: '1rem',
        marginRight: '0.5rem',
        whiteSpace: 'nowrap',
      }}
    >
      {operationTypes
        .map((operation) => ({ operation, label: translateOperationTypeName(t, operation.name) }))
        .sort((a, b) => a.label.localeCompare(b.label))
        .map(({ operation, label }) => (
          <OverflowMenuItem
            key={operation.uuid}
            itemText={label}
            onClick={() => {
              handleSelect(operation);
            }}
          />
        ))}
    </OverflowMenu>
  ) : null;
};

export default StockOperationTypesSelector;
