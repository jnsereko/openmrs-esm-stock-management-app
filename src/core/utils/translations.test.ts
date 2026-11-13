import { describe, expect, it } from 'vitest';
import i18next from 'i18next';
import {
  completedStatusLabel,
  datePickerLocale,
  datePickerMonthLabels,
  paginationTexts,
  translateOperationTypeName,
} from './translations';

describe('paginationTexts', () => {
  // « 1–1 sur 1 éléments »: the range was translated without a count, so never singular (#638)
  it('makes the item range singular for one item', async () => {
    const i18n = i18next.createInstance();
    await i18n.init({
      lng: 'fr',
      resources: {
        fr: {
          translation: {
            paginationItemRange_one: '{{min}}–{{max}} sur {{total}} élément',
            paginationItemRange_other: '{{min}}–{{max}} sur {{total}} éléments',
          },
        },
      },
    });
    const { itemRangeText } = paginationTexts(i18n.t);

    expect(itemRangeText(1, 1, 1)).toBe('1–1 sur 1 élément');
    expect(itemRangeText(1, 10, 56)).toBe('1–10 sur 56 éléments');
  });
});

describe('datePickerMonthLabels', () => {
  it("names the calendar's month arrows", () => {
    const t = ((key: string, defaultValue: string) => `${key}:${defaultValue}`) as unknown as Parameters<
      typeof datePickerMonthLabels
    >[0];

    expect(datePickerMonthLabels(t)).toEqual({
      prevMonthAriaLabel: 'previousMonth:Previous month',
      nextMonthAriaLabel: 'nextMonth:Next month',
    });
  });
});

describe('datePickerLocale', () => {
  // The calendar read « November », « S M T W » on a French screen: the pickers were set to « en » (#641)
  it("gives the calendar the user's language", () => {
    expect(datePickerLocale('fr')).toBe('fr');
    expect(datePickerLocale('fr-FR')).toBe('fr');
    expect(datePickerLocale('en_GB')).toBe('en');
    expect(datePickerLocale(undefined)).toBe('en');
  });
});

describe('completedStatusLabel', () => {
  const t = ((key: string, defaultValue: string) => defaultValue) as unknown as Parameters<
    typeof completedStatusLabel
  >[0];

  // An approved requisition's status line read « Complété » (#641)
  it('names an approval « Approved »', () => {
    expect(
      completedStatusLabel(t, { status: 'AUTHORIZED', operationType: 'requisition', submittedDate: '2026-11-13' }),
    ).toBe('Approved');
    expect(
      completedStatusLabel(t, { status: 'AUTHORIZED', operationType: 'adjustment', submittedDate: '2026-11-13' }),
    ).toBe('Approved');
    // completed by its Stock Issue, the date is still the approval's
    expect(
      completedStatusLabel(t, { status: 'COMPLETED', operationType: 'requisition', submittedDate: '2026-11-13' }),
    ).toBe('Approved');
  });

  it('names a completion « Completed »', () => {
    expect(
      completedStatusLabel(t, { status: 'COMPLETED', operationType: 'stockissue', submittedDate: '2026-11-13' }),
    ).toBe('Completed');
    expect(completedStatusLabel(t, { status: 'COMPLETED', operationType: 'requisition' })).toBe('Completed');
  });
});

describe('translateOperationTypeName', () => {
  // « Requisition » and « Stock Issue » are the server's names, shown in English in French (#644)
  it("translates the types stockmanagement seeds, and keeps a site's own type name", async () => {
    const i18n = i18next.createInstance();
    await i18n.init({
      lng: 'fr',
      resources: {
        fr: {
          translation: {
            operationTypeRequisition: 'Réquisition',
            operationTypeStockIssue: 'Sortie de stock',
          },
        },
      },
    });

    expect(translateOperationTypeName(i18n.t, 'Requisition')).toBe('Réquisition');
    expect(translateOperationTypeName(i18n.t, 'Stock Issue')).toBe('Sortie de stock');
    expect(translateOperationTypeName(i18n.t, 'Receipt')).toBe('Receipt');
    expect(translateOperationTypeName(i18n.t, 'Don reçu')).toBe('Don reçu');
    expect(translateOperationTypeName(i18n.t, undefined)).toBe('');
  });
});
