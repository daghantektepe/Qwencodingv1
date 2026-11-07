import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../../src/App';
import { appendInlineText, htmlForPlainEdit } from '../../src/components/RichText.jsx';

// Faz 0.4: sürüm geri yükleme, paragraf geri alma, not defteri ve eş anlamlı ekleme biçimi korumalı.

// Komut paleti etkin satırı görünür kaydırır; jsdom'da yok.
Element.prototype.scrollIntoView ??= () => {};

type Surface = HTMLElement & { editor: any };
const surface = () => screen.getByLabelText('Metin editörü', { selector: '[role="textbox"]' }) as Surface;
const setHtml = (html: string) => act(() => { surface().editor.commands.setContent(html, true); });
const editorHtml = () => surface().editor.getHTML();

describe('düz metin düzenlemesini zengin metne uygulama', () => {
  it('keeps unchanged blocks with their formatting and turns only changed lines into plain paragraphs', () => {
    const html = '<h2>Başlık</h2><p><strong>Kalın</strong> paragraf</p><p>eski</p>';
    expect(htmlForPlainEdit(html, 'Başlık\nKalın paragraf\nyeni')).toBe(
      '<h2>Başlık</h2><p><strong>Kalın</strong> paragraf</p><p>yeni</p>'
    );
  });

  it('maps list blocks the way the editor flattens them to text', () => {
    // Editör metni: liste kapsayıcıları birer boş satır üretir ("a\n\n\nx\n\ny").
    const html = '<p>a</p><ul><li><p>x</p></li><li><p>y</p></li></ul>';
    expect(htmlForPlainEdit(html, 'b\n\n\nx\n\ny')).toBe('<p>b</p><ul><li><p>x</p></li><li><p>y</p></li></ul>');
  });

  it('appends inline text to the last text block without touching formatting', () => {
    expect(appendInlineText('<p><em>bir</em></p><blockquote><p>iki</p></blockquote>', ' üç')).toBe(
      '<p><em>bir</em></p><blockquote><p>iki üç</p></blockquote>'
    );
  });
});

describe('uygulamada biçim kaybı olmadan yazma', () => {
  beforeEach(() => localStorage.clear());

  it('restores a snapshot with its formatting', async () => {
    const user = userEvent.setup();
    render(<App />);
    setHtml('<h2>Başlık</h2><p><strong>Kalın</strong> metin</p>');

    await user.click(screen.getByTitle('Sürümler (anlık görüntüler)'));
    await user.click(screen.getByText('Sürüm kaydet'));
    await screen.findByTitle('Bu sürüme dön');

    setHtml('<p>bozuldu</p>');
    await user.click(screen.getByTitle('Bu sürüme dön'));
    await user.click(screen.getByText('Evet, geri yükle'));

    await waitFor(() => expect(editorHtml()).toBe('<h2>Başlık</h2><p><strong>Kalın</strong> metin</p>'));
  });

  it('restores an old plain-only snapshot as plain text', async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      'openscriv:snapshots:default:doc-chapter-1',
      JSON.stringify([{ id: 'snap-eski', title: 'Eski', note: '', timestamp: 1, size: 4, content: 'eski\nsürüm' }])
    );
    render(<App />);
    setHtml('<p><strong>yeni</strong></p>');

    await user.click(screen.getByTitle('Sürümler (anlık görüntüler)'));
    await user.click(await screen.findByTitle('Bu sürüme dön'));
    await user.click(screen.getByText('Evet, geri yükle'));

    await waitFor(() => expect(editorHtml()).toBe('<p>eski</p><p>sürüm</p>'));
  });

  it('rolls back one paragraph and keeps the rest of the formatting', async () => {
    const user = userEvent.setup();
    render(<App />);
    setHtml('<h2>Başlık</h2><p></p><p>eski paragraf</p>');

    await user.click(screen.getByTitle('Sürümler (anlık görüntüler)'));
    await user.click(screen.getByText('Sürüm kaydet'));
    await screen.findByTitle('Bu sürüme dön');

    setHtml('<h2>Başlık</h2><p></p><p>yeni paragraf</p>');
    await user.click(screen.getByTitle('Farkı Görsel Karşılaştır (Diff)'));
    const modified = await screen.findByTestId('diff-block-modify');
    await user.click(within(modified).getByTitle('Bu paragrafı eski versiyona geri döndür'));

    await waitFor(() => expect(editorHtml()).toBe('<h2>Başlık</h2><p></p><p>eski paragraf</p>'));
  });

  it('sends a scratchpad note to the end of the draft without dropping formatting', async () => {
    const user = userEvent.setup();
    render(<App />);
    setHtml('<h2>Başlık</h2><p><em>İtalik</em></p>');

    await user.click(screen.getByLabelText('Not defteri'));
    await user.click(screen.getByText('+ Yeni Not'));
    const note = screen.getAllByLabelText('Not metni')[0];
    await user.type(note, 'Kırpıntı');
    await user.click(screen.getAllByText('Taslağa Gönder ↓')[0]);

    await waitFor(() =>
      expect(editorHtml()).toBe('<h2>Başlık</h2><p><em>İtalik</em></p><p></p><p>---</p><p>Kırpıntı</p>')
    );
  });

  it('inserts a dictionary synonym without dropping formatting', async () => {
    const user = userEvent.setup();
    render(<App />);
    setHtml('<h2>Başlık</h2><p><strong>Olay</strong> örgüsü</p>');

    await user.keyboard('{F1}');
    await user.type(await screen.findByRole('combobox'), 'Çevrimdışı Sözlük');
    await user.keyboard('{Enter}');
    await user.click(await screen.findByRole('button', { name: 'çatı' }));

    await waitFor(() => expect(editorHtml()).toBe('<h2>Başlık</h2><p><strong>Olay</strong> örgüsü çatı</p>'));
  });
});
