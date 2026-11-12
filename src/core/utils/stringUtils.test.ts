import { describe, expect, it } from 'vitest';
import { formatStockItemName } from './stringUtils';

describe('formatStockItemName', () => {
  it('shows the name once when the common name is the drug name', () => {
    expect(formatStockItemName('Paracetamol 500mg (Paracetamol 500mg)')).toBe('Paracetamol 500mg');
    expect(formatStockItemName('Paracetamol 500mg (paracetamol 500mg )')).toBe('Paracetamol 500mg');
  });

  it('keeps a different common name', () => {
    expect(formatStockItemName('Paracetamol 500mg (Doliprane)')).toBe('Paracetamol 500mg (Doliprane)');
  });

  it('keeps names without a common name', () => {
    expect(formatStockItemName('Gants (M)')).toBe('Gants (M)');
    expect(formatStockItemName('Gants')).toBe('Gants');
    expect(formatStockItemName(undefined)).toBeUndefined();
  });
});
