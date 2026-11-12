import React from 'react';
import StockItemsTableComponent from './stock-items-table.component';
import { useOpenStockItemFromUrl } from './stock-item.utils';

const StockItems = () => {
  useOpenStockItemFromUrl();

  return (
    <div style={{ margin: '1rem' }}>
      <StockItemsTableComponent />
    </div>
  );
};

export default StockItems;
