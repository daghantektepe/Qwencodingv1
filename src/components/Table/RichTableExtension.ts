/**
 * RichTableExtension.ts — Faz 78: Gelişmiş Tablo Editörü ve Veri Düzenleyici
 */

import { Node, mergeAttributes } from '@tiptap/core';

export interface TableCell {
  id: string;
  content: string;
  colspan?: number;
  rowspan?: number;
  backgroundColor?: string;
  align?: 'left' | 'center' | 'right';
  formula?: string;
}

export interface TableRow {
  id: string;
  cells: TableCell[];
  isHeader?: boolean;
}

export interface TableData {
  id: string;
  rows: TableRow[];
  colWidths?: number[];
}

export class TableMathEngine {
  /**
   * Hücre listesindeki sayısal değerlerin toplamını hesaplar
   */
  public static calculateSum(values: string[]): number {
    return values.reduce((acc, val) => {
      const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
  }

  /**
   * Sayısal ortalama hesaplar
   */
  public static calculateAvg(values: string[]): number {
    const numbers = values
      .map((v) => parseFloat(v.replace(/[^0-9.-]/g, '')))
      .filter((n) => !isNaN(n));
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((a, b) => a + b, 0);
    return Math.round((sum / numbers.length) * 100) / 100;
  }

  /**
   * Tablo formüllerini çözer (=SUM(A1:A3), =AVG(B1:B5))
   */
  public static evaluateFormula(formula: string, table: TableData): number | string {
    const clean = formula.trim().toUpperCase();
    const sumMatch = clean.match(/^=(?:SUM|TOPLAM)\(([A-Z])(\d+):([A-Z])(\d+)\)$/);
    if (sumMatch) {
      const colLetter = sumMatch[1];
      const startRow = parseInt(sumMatch[2], 10) - 1;
      const endRow = parseInt(sumMatch[4], 10) - 1;
      const colIdx = colLetter.charCodeAt(0) - 65;

      const vals: string[] = [];
      for (let r = Math.max(0, startRow); r <= Math.min(table.rows.length - 1, endRow); r++) {
        const cell = table.rows[r]?.cells[colIdx];
        if (cell) vals.push(cell.content);
      }
      return this.calculateSum(vals);
    }

    const avgMatch = clean.match(/^=(?:AVG|ORTALAMA)\(([A-Z])(\d+):([A-Z])(\d+)\)$/);
    if (avgMatch) {
      const colLetter = avgMatch[1];
      const startRow = parseInt(avgMatch[2], 10) - 1;
      const endRow = parseInt(avgMatch[4], 10) - 1;
      const colIdx = colLetter.charCodeAt(0) - 65;

      const vals: string[] = [];
      for (let r = Math.max(0, startRow); r <= Math.min(table.rows.length - 1, endRow); r++) {
        const cell = table.rows[r]?.cells[colIdx];
        if (cell) vals.push(cell.content);
      }
      return this.calculateAvg(vals);
    }

    return formula;
  }
}

/**
 * Tabloyu temiz Markdown formatına derler
 */
export function renderTableToMarkdown(table: TableData): string {
  if (!table.rows || table.rows.length === 0) return '';

  const numCols = Math.max(...table.rows.map((r) => r.cells.length));
  const lines: string[] = [];

  table.rows.forEach((row, rIdx) => {
    const rowCells = row.cells.map((c) => (c.content || ' ').replace(/\|/g, '\\|'));
    while (rowCells.length < numCols) rowCells.push(' ');
    lines.push(`| ${rowCells.join(' | ')} |`);

    // Başlık satırı sonrası ayırıcı çizgi
    if (rIdx === 0) {
      const separators = Array(numCols).fill('---');
      lines.push(`| ${separators.join(' | ')} |`);
    }
  });

  return lines.join('\n');
}

/**
 * Markdown tablosunu ayrıştırıp TableData yapısına dönüştürür
 */
export function parseMarkdownTable(markdown: string): TableData {
  const lines = markdown
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('|') && l.endsWith('|'));

  if (lines.length < 2) {
    return createEmptyTable(2, 2);
  }

  const rows: TableRow[] = [];

  lines.forEach((line, idx) => {
    // Ayırıcı çizgiyi atla (| --- | --- |)
    if (/^\|(\s*[-:]+\s*\|)+$/.test(line)) return;

    const rawCells = line
      .slice(1, -1)
      .split('|')
      .map((c) => c.trim());

    rows.push({
      id: `row-${idx}`,
      isHeader: idx === 0,
      cells: rawCells.map((content, cIdx) => ({
        id: `cell-${idx}-${cIdx}`,
        content,
        align: 'left',
      })),
    });
  });

  return {
    id: `tbl-${Date.now()}`,
    rows,
  };
}

/**
 * Tabloyu stilize edilmiş HTML çıktısına derler
 */
export function renderTableToHtml(table: TableData): string {
  if (!table.rows || table.rows.length === 0) return '';

  const rowsHtml = table.rows
    .map((row) => {
      const tag = row.isHeader ? 'th' : 'td';
      const cellsHtml = row.cells
        .map((cell) => {
          const style = [];
          if (cell.backgroundColor) style.push(`background-color:${cell.backgroundColor}`);
          if (cell.align) style.push(`text-align:${cell.align}`);
          const styleAttr = style.length ? ` style="${style.join(';')}"` : '';
          const colAttr = cell.colspan && cell.colspan > 1 ? ` colspan="${cell.colspan}"` : '';
          const rowAttr = cell.rowspan && cell.rowspan > 1 ? ` rowspan="${cell.rowspan}"` : '';

          return `<${tag}${styleAttr}${colAttr}${rowAttr} class="p-2 border border-slate-700">${cell.content}</${tag}>`;
        })
        .join('');

      return `<tr class="border-b border-slate-800">${cellsHtml}</tr>`;
    })
    .join('');

  return `<table class="openscriv-rich-table w-full border-collapse border border-slate-700 my-4 text-xs font-sans">\n<tbody>\n${rowsHtml}\n</tbody>\n</table>`;
}

/**
 * Boş varsayılan bir tablo oluşturur
 */
export function createEmptyTable(rowCount = 3, colCount = 3): TableData {
  const rows: TableRow[] = [];
  for (let r = 0; r < rowCount; r++) {
    const cells: TableCell[] = [];
    for (let c = 0; c < colCount; c++) {
      cells.push({
        id: `cell-${r}-${c}`,
        content: r === 0 ? `Başlık ${c + 1}` : '',
        align: 'left',
      });
    }
    rows.push({
      id: `row-${r}`,
      isHeader: r === 0,
      cells,
    });
  }
  return {
    id: `table-${Date.now()}`,
    rows,
  };
}

/**
 * TipTap RichTable Node Extension
 */
export const RichTableExtension = Node.create({
  name: 'richTable',

  group: 'block',

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      tableData: {
        default: createEmptyTable(3, 3),
        parseHTML: (element) => {
          const raw = element.getAttribute('data-table');
          return raw ? JSON.parse(decodeURIComponent(raw)) : createEmptyTable(3, 3);
        },
        renderHTML: (attributes) => ({
          'data-table': encodeURIComponent(JSON.stringify(attributes.tableData)),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="rich-table"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const tableData: TableData = node.attrs.tableData || createEmptyTable(3, 3);
    const html = renderTableToHtml(tableData);

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'rich-table',
        class: 'openscriv-rich-table-wrapper my-4 overflow-x-auto',
      }),
      ['div', { class: 'table-render-host', innerHTML: html }],
    ];
  },
});

export default RichTableExtension;
