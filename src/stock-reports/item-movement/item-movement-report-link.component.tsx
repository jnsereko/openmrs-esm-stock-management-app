import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Tile } from '@carbon/react';
import { ArrowRight } from '@carbon/react/icons';
import styles from './item-movement-report.scss';

interface ItemMovementReportLinkProps {
  onOpen: () => void;
}

/** The Rapports page's entry to the on-screen movement of one item, above the downloadable reports */
const ItemMovementReportLink: React.FC<ItemMovementReportLinkProps> = ({ onOpen }) => {
  const { t } = useTranslation();
  return (
    <Tile className={styles.entry}>
      <div>
        <h3 className={styles.itemName}>{t('itemMovementReport', 'Item movement')}</h3>
        <p className={styles.helper}>
          {t(
            'itemMovementReportDescription',
            'The movements of one stock item over a period, on screen, with the stock card to print when needed.',
          )}
        </p>
      </div>
      <Button kind="primary" size="md" renderIcon={ArrowRight} onClick={onOpen}>
        {t('itemMovementReportOpen', 'Open')}
      </Button>
    </Tile>
  );
};

export default ItemMovementReportLink;
