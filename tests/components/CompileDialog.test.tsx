import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CompileDialog from '../../src/components/CompileDialog.jsx';
const { compileToMarkdown, compileToHtml, toFileName } = require('../../electron/compile.js');

const docs = [{ id: 'd1', title: 'Bölüm 1', content: 'Birinci paragraf.\nİkinci paragraf.' }];

describe('compile.js', () => {
  it('Markdown çıktısında her satırı ayrı paragraf yapar', () => {
    const md = compileToMarkdown(docs, 'Kış Masalı');
    expect(md).toContain('# Kış Masalı');
    expect(md).toContain('Birinci paragraf.\n\nİkinci paragraf.');
  });

  it('HTML çıktısında her satır ayrı <p> olur', () => {
    const html = compileToHtml(docs, 'Kış Masalı');
    expect(html).toContain('<p>Birinci paragraf.</p>\n<p>İkinci paragraf.</p>');
  });

  it('dosya adında Türkçe harfleri korur, geçersiz karakterleri değiştirir', () => {
    expect(toFileName('Test Romanı Çalışması')).toBe('Test Romanı Çalışması');
    expect(toFileName('a/b:c?')).toBe('a_b_c_');
    expect(toFileName('  ')).toBe('OpenScriv');
  });
});

describe('CompileDialog', () => {
  afterEach(() => {
    delete (window as any).electronAPI;
  });

  it('derlemeye gerçek proje adını ve kimliğini gönderir', async () => {
    const compileRun = vi.fn().mockResolvedValue({ ok: true, compiled: { content: 'x', fileName: 'Kış Masalı.md', docCount: 1 } });
    const saveCompiledFile = vi.fn().mockResolvedValue({ ok: true, path: 'C:/out/Kış Masalı.md' });
    (window as any).electronAPI = { compileRun, saveCompiledFile };

    render(<CompileDialog open onClose={() => {}} tree={[]} projectId="p-42" projectName="Kış Masalı" />);
    expect(document.querySelector('.compile-dialog')).not.toBeNull();

    fireEvent.click(screen.getByTestId('compile-run'));
    await waitFor(() => expect(saveCompiledFile).toHaveBeenCalled());
    expect(compileRun).toHaveBeenCalledWith(expect.objectContaining({ projectId: 'p-42', projectName: 'Kış Masalı' }));
  });
});
