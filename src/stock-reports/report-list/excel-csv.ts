/**
 * Re-encodes a CSV report so that Excel opens it with a double-click.
 *
 * The server writes comma-separated UTF-8 without a byte-order mark. Excel then reads it as Latin-1 (accents are
 * broken) and, with a French regional setting, expects semicolons (every row lands in column A). A UTF-16LE file
 * with a byte-order mark and tab separators is read correctly whatever the regional setting. The values are copied
 * as written: nothing is reformatted, so a batch number keeps its digits in the file (Excel decides how to show them).
 */

/** Parses RFC 4180 CSV: quoted fields, doubled quotes, commas and line breaks inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let rowHasContent = false;

  const endField = () => {
    row.push(field);
    field = '';
  };
  const endRow = () => {
    if (rowHasContent || row.length > 0) {
      endField();
      rows.push(row);
    }
    row = [];
    rowHasContent = false;
  };

  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
      rowHasContent = true;
    } else if (char === ',') {
      endField();
      rowHasContent = true;
    } else if (char === '\r' || char === '\n') {
      if (char === '\r' && source[i + 1] === '\n') {
        i++;
      }
      endRow();
    } else {
      field += char;
      rowHasContent = true;
    }
  }
  endRow();
  return rows;
}

function toTabField(value: string): string {
  return /[\t\r\n"]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Serialises rows as tab-separated text with CRLF line ends. */
export function toTabSeparated(rows: string[][]): string {
  return rows.map((row) => row.map(toTabField).join('\t')).join('\r\n') + (rows.length > 0 ? '\r\n' : '');
}

/** Encodes text as UTF-16LE, prefixed with the byte-order mark (FF FE). */
export function encodeUtf16LeWithBom(text: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(2 + text.length * 2);
  const view = new DataView(bytes.buffer);
  view.setUint16(0, 0xfeff, true);
  for (let i = 0; i < text.length; i++) {
    view.setUint16(2 + i * 2, text.charCodeAt(i), true);
  }
  return bytes;
}

/** Server CSV text in, the Excel-friendly bytes out. */
export function csvToExcelBytes(csvText: string): Uint8Array<ArrayBuffer> {
  return encodeUtf16LeWithBom(toTabSeparated(parseCsv(csvText)));
}
