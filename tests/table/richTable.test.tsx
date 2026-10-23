import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  TableMathEngine,
  renderTableToMarkdown,
  parseMarkdownTable,
  renderTableToHtml,
  createEmptyTable,
  RichTableExtension,
  TableData,
} from '../../src/components/Table/RichTableExtension';
import { TableControlsMenu } from '../../src/components/Table/TableControlsMenu';

describe('RichTable Model & Math Engine (Faz 78)', () => {
  it('sayı dizisinde toplam (SUM) ve ortalama (AVG) hesaplar', () => {
    const values = ['10', '25.5', 'metin', '14.5'];
    expect(TableMathEngine.calculateSum(values)).toBe(50);
    expect(TableMathEngine.calculateAvg(values)).toBe(16.67);
  });

  it('tablo formüllerini (=SUM, =AVG) koordinatlara göre çözer', () => {
    const table: TableData = {
      id: 'tbl-1',
      rows: [
        {
          id: 'r1',
          cells: [
            { id: 'c1', content: '10' },
            { id: 'c2', content: '100' },
          ],
        },
        {
          id: 'r2',
          cells: [
            { id: 'c3', content: '20' },
            { id: 'c4', content: '200' },
          ],
        },
        {
          id: 'r3',
          cells: [
            { id: 'c5', content: '30' },
            { id: 'c6', content: '300' },
          ],
        },
      ],
    };

    // A1:A3 toplamı (10 + 20 + 30 = 60)
    const sumResult = TableMathEngine.evaluateFormula('=SUM(A1:A3)', table);
    expect(sumResult).toBe(60);

    // B1:B2 ortalaması ((100 + 200) / 2 = 150)
    const avgResult = TableMathEngine.evaluateFormula('=AVG(B1:B2)', table);
    expect(avgResult).toBe(150);
  });

  it('tabloyu standart Markdown çıktısına derler ve geri parse eder', () => {
    const originalTable = createEmptyTable(2, 2);
    originalTable.rows[0].cells[0].content = 'Karakter';
    originalTable.rows[0].cells[1].content = 'Rol';
    originalTable.rows[1].cells[0].content = 'Sherlock';
    originalTable.rows[1].cells[1].content = 'Dedektif';

    const md = renderTableToMarkdown(originalTable);
    expect(md).toContain('| Karakter | Rol |');
    expect(md).toContain('| --- | --- |');
    expect(md).toContain('| Sherlock | Dedektif |');

    const parsed = parseMarkdownTable(md);
    expect(parsed.rows.length).toBe(2);
    expect(parsed.rows[0].cells[0].content).toBe('Karakter');
    expect(parsed.rows[1].cells[0].content).toBe('Sherlock');
  });

  it('HTML tablosunda arka plan rengi ve hizalama stillerini derler', () => {
    const table: TableData = {
      id: 'tbl-styled',
      rows: [
        {
          id: 'r0',
          isHeader: true,
          cells: [
            {
              id: 'c0',
              content: 'Başlık',
              backgroundColor: '#06b6d4',
              align: 'center',
              colspan: 2,
            },
          ],
        },
      ],
    };

    const html = renderTableToHtml(table);
    expect(html).toContain('<table class="openscriv-rich-table');
    expect(html).toContain('background-color:#06b6d4');
    expect(html).toContain('text-align:center');
    expect(html).toContain('colspan="2"');
  });

  it('TipTap RichTableExtension düğüm olarak kayıtlıdır', () => {
    expect(RichTableExtension.name).toBe('richTable');
    expect(RichTableExtension.type).toBe('node');
  });
});

describe('TableControlsMenu Component', () => {
  it('tüm satır ve sütun eylemleri tetiklenir', () => {
    const onAddRow = vi.fn();
    const onDeleteRow = vi.fn();
    const onAddColumn = vi.fn();
    const onDeleteColumn = vi.fn();
    const onSetAlignment = vi.fn();
    const onInsertFormula = vi.fn();

    render(
      <TableControlsMenu
        onAddRow={onAddRow}
        onDeleteRow={onDeleteRow}
        onAddColumn={onAddColumn}
        onDeleteColumn={onDeleteColumn}
        onSetAlignment={onSetAlignment}
        onInsertFormula={onInsertFormula}
      />
    );

    // Satır ekle butonları
    const addRowBelowBtn = screen.getByTitle('Alta Satır Ekle');
    fireEvent.click(addRowBelowBtn);
    expect(onAddRow).toHaveBeenCalledWith('below');

    // Satır sil
    const delRowBtn = screen.getByTitle('Satırı Sil');
    fireEvent.click(delRowBtn);
    expect(onDeleteRow).toHaveBeenCalled();

    // Sütun ekle
    const addColRightBtn = screen.getByTitle('Sağa Sütun Ekle');
    fireEvent.click(addColRightBtn);
    expect(onAddColumn).toHaveBeenCalledWith('right');

    // Sütun sil
    const delColBtn = screen.getByTitle('Sütunu Sil');
    fireEvent.click(delColBtn);
    expect(onDeleteColumn).toHaveBeenCalled();

    // Hizalama
    const alignCenterBtn = screen.getByTitle('Ortala');
    fireEvent.click(alignCenterBtn);
    expect(onSetAlignment).toHaveBeenCalledWith('center');

    // Formül
    const formulaSumBtn = screen.getByTitle('Sütun Toplamı');
    fireEvent.click(formulaSumBtn);
    expect(onInsertFormula).toHaveBeenCalledWith('SUM');
  });
});
