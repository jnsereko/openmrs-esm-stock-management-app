import { type TFunction } from 'i18next';

/** The label of a stock operation status (NEW, SUBMITTED, ...), which the server sends in English capitals. */
export function translateOperationStatus(t: TFunction, status: string | null | undefined) {
  switch (status) {
    case 'NEW':
      return t('statusNew', 'New');
    case 'SUBMITTED':
      return t('submitted', 'Submitted');
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
    itemRangeText: (min: number, max: number, total: number) =>
      t('paginationItemRange', '{{min}}–{{max}} of {{total}} items', { min, max, total }),
    pageRangeText: (_current: number, total: number) => t('paginationPageRange', 'of {{total}} pages', { total }),
    backwardText: t('previousPage', 'Previous page'),
    forwardText: t('nextPage', 'Next page'),
  };
}
