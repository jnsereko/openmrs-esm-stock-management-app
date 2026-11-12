import { type TFunction } from 'i18next';

/** The label of a stock operation status (NEW, SUBMITTED, ...), which the server sends in English capitals. */
export function translateOperationStatus(t: TFunction, status: string | null | undefined) {
  switch (status) {
    case 'NEW':
      return t('statusNew', 'New');
    case 'SUBMITTED':
      return t('submitted', 'Submitted');
    case 'AUTHORIZED':
      return t('statusAuthorized', 'Authorized');
    case 'DISPATCHED':
      return t('dispatched', 'Dispatched');
    case 'COMPLETED':
      return t('completed', 'Completed');
    case 'RETURNED':
      return t('returned', 'Returned');
    case 'CANCELLED':
      return t('cancelled', 'Cancelled');
    case 'REJECTED':
      return t('rejected', 'Rejected');
    default:
      return status;
  }
}

/** Carbon Pagination's texts, which default to English. */
export function paginationTexts(t: TFunction) {
  return {
    itemsPerPageText: t('itemsPerPage', 'Items per page:'),
    // count picks the singular, « 1–1 sur 1 élément » (#638)
    itemRangeText: (min: number, max: number, total: number) =>
      t('paginationItemRange', '{{min}}–{{max}} of {{total}} items', { min, max, total, count: total }),
    pageRangeText: (_current: number, total: number) =>
      t('paginationPageRange', 'of {{count}} pages', { count: total }),
    // The page picker's label; Carbon 1.119 (the app shell's) reads it from this prop
    pageSelectLabelText: (total: number) => t('paginationPageSelectLabel', 'Page of {{count}} pages', { count: total }),
    backwardText: t('previousPage', 'Previous page'),
    forwardText: t('nextPage', 'Next page'),
  };
}

/** DataTable's `translateWithId`: the expand, collapse and select labels, which default to English. */
export function dataTableTranslateWithId(t: TFunction) {
  return (messageId: string) => {
    switch (messageId) {
      case 'carbon.table.row.expand':
        return t('expandCurrentRow', 'Expand current row');
      case 'carbon.table.row.collapse':
        return t('collapseCurrentRow', 'Collapse current row');
      case 'carbon.table.all.expand':
        return t('expandAllRows', 'Expand all rows');
      case 'carbon.table.all.collapse':
        return t('collapseAllRows', 'Collapse all rows');
      case 'carbon.table.all.select':
        return t('selectAllRows', 'Select all rows');
      case 'carbon.table.all.unselect':
        return t('unselectAllRows', 'Unselect all rows');
      case 'carbon.table.row.select':
        return t('selectRow', 'Select row');
      case 'carbon.table.row.unselect':
        return t('unselectRow', 'Unselect row');
      default:
        return messageId;
    }
  };
}

/** TableHeader's `translateWithId`: the sort button's description, which defaults to English. */
export function tableHeaderTranslateWithId(t: TFunction) {
  return (
    messageId: string,
    args?: { header?: unknown; sortDirection?: string; isSortHeader?: boolean; sortStates?: Record<string, string> },
  ) => {
    const header = typeof args?.header === 'string' ? args.header : '';
    if (args?.isSortHeader && args.sortDirection === args.sortStates?.ASC) {
      return t('sortRowsDescending', 'Click to sort rows by {{header}} header in descending order', {
        header,
        interpolation: { escapeValue: false },
      });
    }
    if (args?.isSortHeader && args.sortDirection === args.sortStates?.DESC) {
      return t('unsortRows', 'Click to unsort rows by {{header}} header', {
        header,
        interpolation: { escapeValue: false },
      });
    }
    return t('sortRowsAscending', 'Click to sort rows by {{header}} header in ascending order', {
      header,
      interpolation: { escapeValue: false },
    });
  };
}

/** ComboBox's `translateWithId`: the clear and menu buttons' labels, which default to English. */
export function comboBoxTranslateWithId(t: TFunction) {
  return (messageId: string) => {
    switch (messageId) {
      case 'clear.selection':
        return t('clearSelectedItem', 'Clear selected item');
      case 'clear.all':
        return t('clearAllSelectedItems', 'Clear all selected items');
      case 'open.menu':
        return t('openMenu', 'Open menu');
      case 'close.menu':
        return t('closeMenu', 'Close menu');
      default:
        return messageId;
    }
  };
}

/** DatePicker's previous and next month arrows, which default to English (#638). */
export function datePickerMonthLabels(t: TFunction) {
  return {
    prevMonthAriaLabel: t('previousMonth', 'Previous month'),
    nextMonthAriaLabel: t('nextMonth', 'Next month'),
  };
}
