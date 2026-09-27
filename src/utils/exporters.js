/**
 * OpenScriv - Faz 8: Export & Compile yardimcilari
 *
 * Tamamen yerel, bulutsuz mimari: derleme tarayici/renderer surecinde yapilir,
 * Electron ortamininda oncelikle native Save Dialog + dosya yazimi IPC'si ile,
 * degilse Blob tabanli tarayici indirmesiyle disari aktarilir.
 *
 * Desteklenen formatlar: .md (Markdown), .txt, .html, .epub*, .docx*, .pdf*
 * Not: epub/docx/pdf uretimi icin ek npm paketleri gerekebilir; bu modul onlari
 * dinamik import ile yukaer ve paket yoksa kullaniciya net hata dondurur.
 */

import { flattenDocs } from '../state/tree.js';

// ---------------------------------------------------------------------------
// Derleme (compile): agactaki dokumanlari sirali tek metne cevirir
// ---------------------------------------------------------------------------

/**
 * @param {Node[]} tree - proje agaci
 * @param {Object} options
 * @param {boolean} [options.includeTitle=true]      - her dokuman basligini ekle
 * @param {'none'|'markdown'|'html'} [options.headingStyle='markdown']
 * @param {string}  [options.separator='\n\n---\n\n'] - dokumanlar arasi ayrac
 * @param {string}  [options.documentOrder]          - 'tree' (varsayilan)
 * @returns {{ title: string, body: string, docCount: number }}
 */
export function compileTree(tree, options = {}) {
  const {
    includeTitle = true,
    headingStyle = 'markdown',
    separator = '\n\n---\n\n',
  } = options;

  const docs = flattenDocs(Array.isArray(tree) ? tree : []);
  const parts = [];

  for (const doc of docs) {
    let block = '';
    if (includeTitle) {
      if (headingStyle === 'html') {
        block += `<h2>${escapeHtml(doc.title)}</h2>\n`;
      } else if (headingStyle === 'markdown') {
        block += `## ${doc.title}\n\n`;
      } else {
        block += `${doc.title}\n${'='.repeat(doc.title.length)}\n\n`;
      }
    }
    block += doc.content || '';
    parts.push(block);
  }

  return {
    title: docs.length > 0 ? undefined : undefined,
    body: parts.join(separator),
    docCount: docs.length,
  };
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Format serilestiricileri (saf string/ArrayBuffer ciktilar)
// ---------------------------------------------------------------------------

/** Düz metin olarak derle. */
export function toPlainText(compiled, projectName = 'OpenScriv Projesi') {
  return `${projectName}\n\n${compiled.body}`;
}

/** Markdown olarak derle. */
export function toMarkdown(compiled, projectName = 'OpenScriv Projesi') {
  return `# ${projectName}\n\n${compiled.body}`;
}

/** Tam HTML belgesi üret. */
export function toHtmlDocument(compiled, projectName = 'OpenScriv Projesi') {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(projectName)}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; max-width: 720px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #2b2b2b; }
  h1 { text-align: center; font-weight: normal; }
  h2 { margin-top: 2em; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  hr { border: none; border-top: 1px solid #ccc; margin: 3em 0; }
  p { white-space: pre-wrap; }
</style>
</head>
<body>
<h1>${escapeHtml(projectName)}</h1>
${wrapParagraphs(compiled.body)}
</body>
</html>`;
}

function wrapParagraphs(text) {
  // Basit donusum: bos satirla ayrilmis bloklari <p>, ayraclari <hr> yapar.
  return String(text ?? '')
    .split(/\n{2,}/)
    .map((block) => {
      const t = block.trim();
      if (!t) return '';
      if (/^(-{3,}|_{3,})$/.test(t)) return '<hr />';
      if (t.startsWith('## ')) return `<h2>${escapeHtml(t.slice(3))}</h2>`;
      return `<p>${escapeHtml(t).replace(/\n/g, '<br />')}</p>`;
    })
    .join('\n');
}

// ---------------------------------------------------------------------------
// EPUB / DOCX / PDF — opsiyonel paketlerle, dinamik import
// ---------------------------------------------------------------------------

async function tryImport(name) {
  try {
    return await import(/* @vite-ignore */ name);
  } catch {
    return null;
  }
}

/**
 * EPUB uretimi. Gerekli paket: "epub-gen-memory" veya benzeri bir saf-JS olusturucu.
 * Paket kurulu degilse hata mesajiyla birlikte null doner.
 */
export async function toEpubBlob(compiled, projectName = 'OpenScriv Projesi') {
  const mod = await tryImport('epub-gen-memory');
  const EpubGen = mod?.default || mod?.EpubGen;
  if (!EpubGen) {
    throw new Error(
      'EPUB export için "epub-gen-memory" paketi gerekli: npm i epub-gen-memory'
    );
  }
  const chapters = splitIntoChapters(compiled.body);
  const gen = new EpubGen({
    title: projectName,
    author: 'OpenScriv',
    language: 'tr',
    toc: chapters.map((c, i) => ({ label: c.title, href: `chapter-${i}.xhtml` })),
    content: chapters.map((c, i) => ({
      data: `<h2>${escapeHtml(c.title)}</h2>${wrapParagraphs(c.body)}`,
      filename: `chapter-${i}.xhtml`,
      title: c.title,
    })),
  });
  const base64 = await gen.generate();
  return base64ToBlob(base64, 'application/epub+zip');
}

/**
 * DOCX uretimi. Gerekli paket: "docx".
 */
export async function toDocxBlob(compiled, projectName = 'OpenScriv Projesi') {
  const mod = await tryImport('docx');
  if (!mod?.Document || !mod?.Packer) {
    throw new Error('DOCX export için "docx" paketi gerekli: npm i docx');
  }
  const { Document, Packer, Paragraph, HeadingLevel, TextRun } = mod;
  const chapters = splitIntoChapters(compiled.body);
  const children = [];
  children.push(
    new Paragraph({ text: projectName, heading: HeadingLevel.TITLE })
  );
  for (const ch of chapters) {
    children.push(new Paragraph({ text: ch.title, heading: HeadingLevel.HEADING_1 }));
    for (const para of ch.body.split(/\n{2,}/)) {
      const t = para.trim();
      if (t) children.push(new Paragraph({ children: [new TextRun(t)] }));
    }
  }
  const doc = new Document({ sections: [{ properties: {}, children }] });
  const blob = await Packer.toBlob(doc);
  return blob;
}

/**
 * PDF uretimi. Gerekli paket: "jspdf" (+ html-to-pdfmake yerine sade paragraf akisi).
 */
export async function toPdfBlob(compiled, projectName = 'OpenScriv Projesi') {
  const mod = await tryImport('jspdf');
  const JsPdfCtor = mod?.jsPDF || mod?.default?.jsPDF || mod?.default;
  if (!JsPdfCtor) {
    throw new Error('PDF export için "jspdf" paketi gerekli: npm i jspdf');
  }
  const pdf = new JsPdfCtor({ unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  pdf.setFont('times', 'normal');
  pdf.setFontSize(20);
  pdf.text(projectName, pageWidth / 2, y, { align: 'center' });
  y += 14;

  pdf.setFontSize(11);
  const chapters = splitIntoChapters(compiled.body);
  for (const ch of chapters) {
    if (y > 260) {
      pdf.addPage();
      y = margin;
    }
    pdf.setFont('times', 'bold');
    pdf.setFontSize(14);
    pdf.text(ch.title, margin, y);
    y += 8;
    pdf.setFont('times', 'normal');
    pdf.setFontSize(11);
    for (const para of ch.body.split(/\n{2,}/)) {
      const lines = pdf.splitTextToSize(para.trim(), maxWidth);
      for (const line of lines) {
        if (y > 275) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(line, margin, y);
        y += 5.5;
      }
      y += 3;
    }
  }
  return pdf.output('blob');
}

function splitIntoChapters(body) {
  // '## Baslik' markdown basliklarina gore bol; yoksa tek bolum say.
  const chunks = String(body ?? '').split(/^## /m);
  const out = [];
  if (chunks[0]?.trim()) out.push({ title: '', body: chunks[0].trim() });
  for (let i = 1; i < chunks.length; i++) {
    const idx = chunks[i].indexOf('\n');
    const title = idx === -1 ? chunks[i] : chunks[i].slice(0, idx);
    const rest = idx === -1 ? '' : chunks[i].slice(idx + 1);
    out.push({ title: title.trim(), body: rest.trim() });
  }
  return out.length ? out : [{ title: '', body: String(body ?? '') }];
}

function base64ToBlob(base64, mime) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

// ---------------------------------------------------------------------------
// Disa aktarma katmani (Electron native save || tarayici indirme)
// ---------------------------------------------------------------------------

const MIME_BY_EXT = {
  txt: 'text/plain;charset=utf-8',
  md: 'text/markdown;charset=utf-8',
  html: 'text/html;charset=utf-8',
  epub: 'application/epub+zip',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pdf: 'application/pdf',
};

export const EXPORT_FORMATS = [
  { id: 'md', label: 'Markdown (.md)', ext: 'md' },
  { id: 'txt', label: 'Düz Metin (.txt)', ext: 'txt' },
  { id: 'html', label: 'HTML (.html)', ext: 'html' },
  { id: 'pdf', label: 'PDF (.pdf)', ext: 'pdf' },
  { id: 'docx', label: 'Word (.docx)', ext: 'docx' },
  { id: 'epub', label: 'ePUB (.epub)', ext: 'epub' },
];

/**
 * Secilen formatta projeyi disa aktarir.
 * Electron'da oncelik window.electronAPI.saveFileWithDialog IPC'sindedir
 * (kullanici hedef yolu secer, dosya yerel diske yazilir). Degilse tarayici
 * indirmesine (Blob + <a download>) duser.
 *
 * @returns {Promise<{ok:boolean, path?:string, method:'electron'|'browser', error?:string}>}
 */
export async function exportProject(tree, { formatId = 'md', projectName = 'OpenScriv Projesi' } = {}) {
  const fmt = EXPORT_FORMATS.find((f) => f.id === formatId) || EXPORT_FORMATS[0];
  const compiled = compileTree(tree, {
    headingStyle: fmt.id === 'html' ? 'html' : 'markdown',
  });

  let blobOrText;
  try {
    switch (fmt.id) {
      case 'txt':
        blobOrText = new Blob([toPlainText(compiled, projectName)], { type: MIME_BY_EXT.txt });
        break;
      case 'md':
        blobOrText = new Blob([toMarkdown(compiled, projectName)], { type: MIME_BY_EXT.md });
        break;
      case 'html':
        blobOrText = new Blob([toHtmlDocument(compiled, projectName)], { type: MIME_BY_EXT.html });
        break;
      case 'pdf':
        blobOrText = await toPdfBlob(compiled, projectName);
        break;
      case 'docx':
        blobOrText = await toDocxBlob(compiled, projectName);
        break;
      case 'epub':
        blobOrText = await toEpubBlob(compiled, projectName);
        break;
      default:
        throw new Error(`Bilinmeyen format: ${fmt.id}`);
    }
  } catch (err) {
    return { ok: false, error: err.message };
  }

  const fileName = `${sanitizeFileName(projectName)}.${fmt.ext}`;

  // 1) Electron native kaydetme
  if (typeof window !== 'undefined' && window.electronAPI?.saveFileWithDialog) {
    try {
      const buf = new Uint8Array(await blobOrText.arrayBuffer());
      const res = await window.electronAPI.saveFileWithDialog({
        defaultPath: fileName,
        filterName: fmt.label,
        extensions: [fmt.ext],
        data: Array.from(buf),
      });
      if (res?.ok) return { ok: true, path: res.path, method: 'electron' };
      if (res?.canceled) return { ok: false, canceled: true, method: 'electron' };
      return { ok: false, error: res?.error || 'Kaydedilemedi', method: 'electron' };
    } catch (err) {
      return { ok: false, error: err.message, method: 'electron' };
    }
  }

  // 2) Tarayici indirmesi (fallback — gelistirme modu / plain web)
  try {
    const url = URL.createObjectURL(blobOrText);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return { ok: true, path: fileName, method: 'browser' };
  } catch (err) {
    return { ok: false, error: err.message, method: 'browser' };
  }
}

function sanitizeFileName(name) {
  return String(name || 'proje').replace(/[\\/:*?"<>|]/g, '_').trim() || 'proje';
}
