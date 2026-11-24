import { csvToExcelBytes } from './excel-csv';

const fileNameFromDisposition = (disposition: string | null, fallback: string): string => {
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition ?? '');
  return match ? decodeURIComponent(match[1]) : fallback;
};

/**
 * Downloads a report artifact. A CSV is fetched and re-encoded for Excel (see excel-csv.ts); the server file is not
 * changed. Anything else, or any failure, opens the URL as before.
 */
export async function downloadReport(url: string, uuid: string, fileExt: string | undefined | null): Promise<void> {
  if (fileExt?.toLowerCase() !== 'csv') {
    window.open(url, '_blank');
    return;
  }
  try {
    const response = await fetch(url, { credentials: 'same-origin' });
    const disposition = response.headers.get('Content-Disposition');
    // Errors such as an expired session come back as text with no attachment header: do not save them as a report.
    if (!response.ok || !disposition) {
      window.open(url, '_blank');
      return;
    }
    const bytes = csvToExcelBytes(await response.text());
    const blob = new Blob([bytes], { type: 'text/csv;charset=utf-16le' });
    const link = document.createElement('a');
    const objectUrl = URL.createObjectURL(blob);
    link.href = objectUrl;
    link.download = fileNameFromDisposition(disposition, `${uuid}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
  } catch {
    window.open(url, '_blank');
  }
}
