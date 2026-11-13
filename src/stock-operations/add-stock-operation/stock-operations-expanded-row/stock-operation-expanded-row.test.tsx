import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { type StockOperationDTO } from '../../../core/api/types/stockOperation/StockOperationDTO';
import StockOperationExpandedRow from './stock-operation-expanded-row.component';

vi.mock('../../../stock-lookups/stock-lookups.resource', () => ({
  useStockOperationTypes: () => ({ types: { results: [] }, isLoading: false, error: undefined }),
}));

describe('StockOperationExpandedRow', () => {
  it('renders nothing, rather than crashing, when the operation is gone from the list', () => {
    const { container } = render(<StockOperationExpandedRow model={undefined} />);

    expect(container).toBeEmptyDOMElement();
  });

  // An approved requisition read « Complété : … Par KWIZERA  Alika Flory » (#641)
  it("names an approval « Approved », with one space between the approver's names", () => {
    const requisition = {
      uuid: 'requisition-uuid',
      operationType: 'requisition',
      status: 'AUTHORIZED',
      submittedDate: '2026-11-13T02:20:00.000+0200',
      submittedByFamilyName: 'IRAKOZE',
      submittedByGivenName: 'Evelyne',
      completedDate: '2026-11-13T02:22:00.000+0200',
      completedByFamilyName: 'KWIZERA',
      completedByGivenName: 'Alika Flory',
      stockOperationItems: [],
    } as unknown as StockOperationDTO;

    render(<StockOperationExpandedRow model={requisition} />);

    expect(screen.getByText('Approved:')).toBeInTheDocument();
    expect(screen.queryByText('Completed:')).not.toBeInTheDocument();
    expect(screen.getByText('KWIZERA Alika Flory')).toBeInTheDocument();
  });
});
