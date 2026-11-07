import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import {
  Extension,
  createDocument,
  getSchema,
  getHTMLFromFragment,
  getTextBetween,
  getTextSerializersFromSchema,
} from '@tiptap/core';
import { Fragment, Slice } from '@tiptap/pm/model';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Quote,
  List,
  ListOrdered,
  Undo2,
  Redo2,
} from 'lucide-react';
import { computeLcsDiff } from '../services/diff/textDiffEngine';
import './RichText.css';

/**
 * RichText — TipTap tabanlı yazım yüzeyi (Editör ve Odak Modu ortak).
 *
 * Zengin metin doc.contentHtml'de, düz metin karşılığı doc.content'te tutulur:
 *   onChange(docId, plainText, html)
 * Kelime sayımı, arama, derleme vb. düz metni okumaya devam eder.
 *
 * Çağıran bileşeni doküman başına key'lemeli (key={doc.id}); böylece geri al
 * geçmişi belgeler arasında karışmaz.
 */

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Her satır bir paragraf; getText({ blockSeparator: '\n' }) ile birebir geri döner.
export function plainToHtml(text) {
  return String(text || '')
    .split('\n')
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('');
}

export function docToHtml(doc) {
  return doc?.contentHtml ?? plainToHtml(doc?.content);
}

// Editörün şeması (Placeholder/TabKey şemaya düğüm eklemez).
let schemaCache = null;
const schema = () => (schemaCache ??= getSchema([StarterKit]));

/**
 * Düz metin üzerinde yapılmış bir düzenlemeyi (ör. paragraf geri alma) zengin metne uygular.
 * Metni değişmeyen üst düzey bloklar biçimiyle aynen kalır; değişen ve yeni satırlar düz paragraf olur.
 * Satırlar editörün getText({ blockSeparator: '\n' }) çıktısıyla birebir eşlenir.
 * ponytail: değişen bloğun satır içi biçimi düşer; blok içi eşleme gerekirse buradan büyütülür.
 */
export function htmlForPlainEdit(html, nextText) {
  const s = schema();
  const doc = createDocument(html, s);
  const opts = { blockSeparator: '\n', textSerializers: getTextSerializersFromSchema(s) };
  const blocks = [];
  const oldLines = [];
  const lineBlock = [];
  doc.forEach((node, pos, i) => {
    const lines = getTextBetween(doc, { from: pos, to: pos + node.nodeSize }, opts).split('\n');
    blocks.push({ node, first: oldLines.length, count: lines.length });
    for (const line of lines) {
      oldLines.push(line);
      lineBlock.push(i);
    }
  });
  const ops = computeLcsDiff(oldLines, String(nextText ?? '').split('\n'));

  // Blok, bütün satırları araya ekleme/silme girmeden 'equal' kaldıysa korunur.
  const hits = blocks.map(() => []);
  let o = 0;
  ops.forEach((op, k) => {
    if (op.type === 'equal') hits[lineBlock[o]].push(k);
    if (op.type !== 'insert') o += 1;
  });
  const kept = blocks.map(
    (b, i) => hits[i].length === b.count && hits[i][b.count - 1] - hits[i][0] === b.count - 1
  );

  let out = '';
  o = 0;
  for (const op of ops) {
    if (op.type === 'insert') {
      out += plainToHtml(op.item);
      continue;
    }
    const b = lineBlock[o];
    if (op.type === 'equal') {
      if (!kept[b]) out += plainToHtml(op.item);
      else if (blocks[b].first === o) out += getHTMLFromFragment(Fragment.from(blocks[b].node), s);
    }
    o += 1;
  }
  return out;
}

// Metni son metin bloğunun sonuna ekler (düz metindeki `content + text` karşılığı); biçim korunur.
export function appendInlineText(html, text) {
  if (!text) return html;
  const s = schema();
  const doc = createDocument(html, s);
  let end = -1;
  doc.descendants((node, pos) => {
    if (node.isTextblock) end = pos + node.nodeSize - 1;
  });
  if (end < 0) return html + plainToHtml(text);
  const next = doc.replace(end, end, new Slice(Fragment.from(s.text(text)), 0, 0));
  return getHTMLFromFragment(next.content, s);
}

// Tab: listede girinti, metinde sekme karakteri (odak editörden kaçmasın).
const TabKey = Extension.create({
  name: 'tabKey',
  addKeyboardShortcuts() {
    return {
      Tab: () =>
        this.editor.commands.sinkListItem('listItem') || this.editor.commands.insertContent('\t'),
    };
  },
});

const TOOLS = [
  { icon: Bold, label: 'Kalın (Ctrl+B)', run: (c) => c.toggleBold(), active: ['bold'] },
  { icon: Italic, label: 'İtalik (Ctrl+I)', run: (c) => c.toggleItalic(), active: ['italic'] },
  { icon: Strikethrough, label: 'Üstü çizili', run: (c) => c.toggleStrike(), active: ['strike'] },
  { divider: true },
  { icon: Heading2, label: 'Ara başlık', run: (c) => c.toggleHeading({ level: 2 }), active: ['heading', { level: 2 }] },
  { icon: Quote, label: 'Alıntı', run: (c) => c.toggleBlockquote(), active: ['blockquote'] },
  { icon: List, label: 'Madde listesi', run: (c) => c.toggleBulletList(), active: ['bulletList'] },
  { icon: ListOrdered, label: 'Numaralı liste', run: (c) => c.toggleOrderedList(), active: ['orderedList'] },
  { divider: true },
  { icon: Undo2, label: 'Geri al (Ctrl+Z)', run: (c) => c.undo(), can: (ed) => ed.can().undo() },
  { icon: Redo2, label: 'Yinele (Ctrl+Y)', run: (c) => c.redo(), can: (ed) => ed.can().redo() },
];

// Daktilo kaydırma: imlecin satırını kaydırma alanının dikey ortasına getirir.
function centerCaret(editor, scroller) {
  if (!scroller) return;
  try {
    const { top } = editor.view.coordsAtPos(editor.state.selection.head);
    const box = scroller.getBoundingClientRect();
    scroller.scrollTop += top - (box.top + box.height / 2);
  } catch {
    // Görünüm henüz yerleşmemiş (ör. jsdom): kaydırma atlanır.
  }
}

export default function RichText({
  doc,
  onChange,
  ariaLabel,
  className = '',
  placeholder = 'Boş sayfaya ilk cümleni bırak…',
  toolbar = true,
  typewriter = false,
  autoFocus = false,
}) {
  const html = docToHtml(doc);
  const lastHtmlRef = useRef(html);
  const scrollRef = useRef(null);
  const live = useRef({});
  live.current = { doc, onChange, typewriter };

  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder }), TabKey],
    content: html,
    autofocus: autoFocus ? 'end' : false,
    editorProps: {
      attributes: {
        class: className,
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': ariaLabel,
        spellcheck: 'true',
        'data-testid': 'editor-textarea',
      },
    },
    onUpdate: ({ editor: ed }) => {
      const { doc: d, onChange: cb } = live.current;
      if (!d || !cb) return;
      const next = ed.getHTML();
      lastHtmlRef.current = next;
      cb(d.id, ed.getText({ blockSeparator: '\n' }), next);
    },
    onSelectionUpdate: ({ editor: ed }) => {
      if (live.current.typewriter) centerCaret(ed, scrollRef.current);
    },
  });

  // Dışarıdan gelen değişiklik (snapshot geri yükleme, not defteri, bölünmüş ekrandaki diğer editör).
  useEffect(() => {
    if (!editor || html === lastHtmlRef.current) return;
    lastHtmlRef.current = html;
    editor.commands.setContent(html, false);
  }, [editor, html]);

  return (
    <div className="rt">
      {toolbar && editor && (
        <div className="rt__toolbar" role="toolbar" aria-label="Biçimlendirme">
          {TOOLS.map((t, i) => {
            if (t.divider) return <span key={`d${i}`} className="rt__divider" aria-hidden="true" />;
            const Icon = t.icon;
            const active = t.active ? editor.isActive(...t.active) : false;
            return (
              <button
                key={t.label}
                type="button"
                className={`rt__tool${active ? ' is-active' : ''}`}
                title={t.label}
                aria-label={t.label}
                aria-pressed={t.active ? active : undefined}
                disabled={t.can ? !t.can(editor) : false}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => t.run(editor.chain().focus()).run()}
              >
                <Icon size={15} strokeWidth={2} />
              </button>
            );
          })}
        </div>
      )}
      <div className="rt__scroll" ref={scrollRef}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
