import { describe, expect, it } from 'vitest';
import { csvToExcelBytes, encodeUtf16LeWithBom, parseCsv, toTabSeparated } from './excel-csv';

const decode = (bytes: Uint8Array) => new TextDecoder('utf-16le').decode(bytes.slice(2));

describe('parseCsv', () => {
  it('splits plain fields and keeps empty cells', () => {
    expect(parseCsv('a,,c\n,,\n')).toEqual([
      ['a', '', 'c'],
      ['', '', ''],
    ]);
  });

  it('handles quoted commas, doubled quotes and embedded line breaks', () => {
    expect(parseCsv('"Paracetamol, 500 mg","say ""hi""","line1\nline2"\nx,y,z')).toEqual([
      ['Paracetamol, 500 mg', 'say "hi"', 'line1\nline2'],
      ['x', 'y', 'z'],
    ]);
  });

  it('accepts CRLF, a missing final line break and a leading byte-order mark', () => {
    expect(parseCsv('﻿a,b\r\nc,d')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('keeps a quoted empty string as an empty cell', () => {
    expect(parseCsv('"",x\n')).toEqual([['', 'x']]);
  });

  it('returns no rows for an empty file', () => {
    expect(parseCsv('')).toEqual([]);
  });
});

describe('toTabSeparated', () => {
  it('joins with tabs and CRLF, and quotes only what needs it', () => {
    expect(toTabSeparated([['a b', 'c\td', 'e"f', 'g\nh']])).toBe('a b\t"c\td"\t"e""f"\t"g\nh"\r\n');
  });

  it('keeps numbers, leading zeros and dates exactly as written', () => {
    const row = ['0251999', '2511075', '12345678901234567890', '30-Dec-2027', '1.50'];
    expect(toTabSeparated([row])).toBe(`${row.join('\t')}\r\n`);
  });
});

describe('encodeUtf16LeWithBom', () => {
  it('starts with FF FE and writes each character little-endian', () => {
    const bytes = encodeUtf16LeWithBom('é');
    expect(Array.from(bytes)).toEqual([0xff, 0xfe, 0xe9, 0x00]);
  });

  it('keeps characters outside the basic plane', () => {
    expect(decode(encodeUtf16LeWithBom('a😀'))).toBe('a😀');
  });
});

describe('csvToExcelBytes', () => {
  it('turns a server CSV into a BOM-prefixed tab-separated file with accents intact', () => {
    const csv = 'Article,Lot,Quantité\n"Comprimé, 500 mg",0251999,12\nAdrénaline,2511075,3\n';
    const bytes = csvToExcelBytes(csv);
    expect(bytes[0]).toBe(0xff);
    expect(bytes[1]).toBe(0xfe);
    expect(decode(bytes)).toBe('Article\tLot\tQuantité\r\nComprimé, 500 mg\t0251999\t12\r\nAdrénaline\t2511075\t3\r\n');
  });
});
