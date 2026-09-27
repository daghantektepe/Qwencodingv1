/**
 * OpenScriv - Faz 12: Compile / Export (main process)
 *
 * Seçili dokümanları sırayla birleştirerek tek bir çıktı dosyası üretir.
 * Desteklenen formatlar: markdown (.md), html (.html), plain text (.txt).
 * docx/pdf gibi gelişmiş formatlar için opsiyonel paket bağımlılıkları
 * renderer tarafında (exporters.js) ele alınır; main process sade tutulur.
 *
 * IPC Kanalları:
 *   'compile:run' → { projectId, docIds?: string[], format?, projectName?, options? } => { ok, compiled?, error? }
 *   'save-compiled-file' → { content, fileName, filterName?, extensions? } => { ok, path?, canceled?, error? }
 */

const path = require('path');
const fs = require('fs/promises');
const { app, ipcMain, dialog } = require('electron');

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------

function getProjectsRoot() {
  return path.join(app.getPath('documents'), 'OpenScrivProjects');
}

function sanitizeId(rawId) {
  // Dosya adı enjeksiyonunu önlemek için güvenli karakterlere indirger
  return String(rawId).replace(/[^a-zA-Z0-9_-]/g, '_');
}

function docsDir(projectId) {
  return path.join(getProjectsRoot(), sanitizeId(projectId), 'docs');
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Belirli bir dokümanın içeriğini diske okur.
 */
async function readDocumentContent(projectId, docId) {
  const filePath = path.join(docsDir(projectId), `${sanitizeId(docId)}.md`);
  if (!(await fileExists(filePath))) return '';
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return '';
  }
}

/**
 * Ağaçtan seçilen dokümanların listesini çeker (sıra korunarak).
 * @param {Node[]} tree 
 * @param {string[]} selectedDocIds - null/undefined ise tüm dokümanlar dahil edilir
 * @returns {{ id: string, title: string, content: string }[]}
 */
function collectSelectedDocs(tree, selectedDocIds) {
  const allDocs = [];
  
  /**
   * Recursive walk to flatten all documents in order
   */
  const walk = (nodes) => {
    for (const n of nodes || []) {
      if (n.type === 'doc') {
        allDocs.push({ id: n.id, title: n.title, content: n.content || '' });
      }
      if (n.type === 'folder' && Array.isArray(n.children)) {
        walk(n.children);
      }
    }
  };
  
  walk(tree);
  
  // Eğer selection verildiyse sadece onları döndür, aksi halde hepsini
  if (!selectedDocIds || !Array.isArray(selectedDocIds) || selectedDocIds.length === 0) {
    return allDocs;
  }
  
  const set = new Set(selectedDocIds.map(String));
  return allDocs.filter((d) => set.has(d.id));
}

// ---------------------------------------------------------------------------
// Derleme fonksiyonları (saf string işlemleri)
// ---------------------------------------------------------------------------

/**
 * Bir HTML belgesi içinde escape etmek gereken özel karakterleri çevirir.
 */
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Paragrafları <p> etiketleriyle sarar.
 */
function wrapParagraphs(text) {
  return String(text ?? '')
    .split(/\n\s*\n/)
    .map((block) => {
      const t = block.trim();
      if (!t) return '';
      if (/^(-{3,}|_{3,})$/.test(t)) return '<hr />';
      if (t.startsWith('## ')) return `<h2>${escapeHtml(t.slice(3))}</h2>`;
      return `<p>${escapeHtml(t).replace(/\n/g, '<br />')}</p>`;
    })
    .filter(Boolean)
    .join('\n');
}

/**
 * Dokümanları Markdown olarak birleştirir.
 */
function compileToMarkdown(docs, projectName = 'OpenScriv Projesi', options = {}) {
  const { includeTitle = true, separator = '\n\n---\n\n' } = options;
  
  let body = `# ${projectName}\n\n`;
  const parts = [];
  
  for (const doc of docs) {
    let block = '';
    if (includeTitle) {
      block += `## ${doc.title}\n\n`;
    }
    block += doc.content || '';
    parts.push(block);
  }
  
  body += parts.join(separator);
  return body;
}

/**
 * Dokümanları HTML olarak birleştirir.
 */
function compileToHtml(docs, projectName = 'OpenScriv Projesi', options = {}) {
  const { includeTitle = true, separator = '\n\n<hr />\n\n' } = options;
  
  let html = `<!DOCTYPE html>\n<html lang="tr">\n<head>\n<meta charset="UTF-8" />\n<title>${escapeHtml(projectName)}</title>\n<style>\n  body { font-family: Georgia, serif; max-width: 720px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #2b2b2b; }\n  h1 { text-align: center; font-weight: normal; }\n  h2 { margin-top: 2em; border-bottom: 1px solid #ddd; padding-bottom: 4px; }\n  hr { border: none; border-top: 1px solid #ccc; margin: 3em 0; }\n</style>\n</head>\n<body>\n<h1>${escapeHtml(projectName)}</h1>\n`;
  
  const parts = [];
  for (const doc of docs) {
    let block = '';
    if (includeTitle) {
      block += `<h2>${escapeHtml(doc.title)}</h2>\n`;
    }
    block += wrapParagraphs(doc.content || '');
    parts.push(block);
  }
  
  html += parts.join(separator);
  html += `\n</body>\n</html>`;
  return html;
}

/**
 * Dokümanları düz metin olarak birleştirir.
 */
function compileToPlainText(docs, projectName = 'OpenScriv Projesi', options = {}) {
  const { includeTitle = true, separator = '\n\n====================\n\n' } = options;
  
  let text = `${projectName}\n\n${'='.repeat(projectName.length)}\n\n`;
  const parts = [];
  
  for (const doc of docs) {
    let block = '';
    if (includeTitle) {
      block += `${doc.title}\n${'-'.repeat(doc.title.length)}\n\n`;
    }
    block += doc.content || '';
    parts.push(block);
  }
  
  text += parts.join(separator);
  return text;
}

// ---------------------------------------------------------------------------
// IPC Handler'ları
// ---------------------------------------------------------------------------

/**
 * compile-project: Seçili dokümanları derleyip içerik + önerilen dosya adını döner.
 * payload = { projectId, tree, docIds?, format?, projectName?, options? }
 *   - tree: Node[] (renderer'dan gelen tam ağaç)
 *   - docIds: string[] | undefined (boşsa tüm dokümanlar)
 *   - format: 'markdown'|'html'|'plain' (varsayılan: 'markdown')
 *   - options: { includeTitle?, separator? }
 */
ipcMain.handle('compile:run', async (_evt, payload) => {
  try {
    const { projectId, tree, docIds, format = 'markdown', projectName = 'OpenScriv Projesi', options = {} } = payload || {};
    
    if (!projectId) throw new Error('compile-project: projectId zorunludur.');
    
    // Seçili dokümanları topla
    const selectedDocs = collectSelectedDocs(Array.isArray(tree) ? tree : [], docIds);
    
    if (selectedDocs.length === 0) {
      throw new Error('Derlenecek doküman bulunamadı.');
    }
    
    let content = '';
    let ext = '.md';
    let mime = 'text/markdown;charset=utf-8';
    
    switch (format) {
      case 'html':
        content = compileToHtml(selectedDocs, projectName, options);
        ext = '.html';
        mime = 'text/html;charset=utf-8';
        break;
      case 'plain':
        content = compileToPlainText(selectedDocs, projectName, options);
        ext = '.txt';
        mime = 'text/plain;charset=utf-8';
        break;
      case 'markdown':
      default:
        content = compileToMarkdown(selectedDocs, projectName, options);
        ext = '.md';
        mime = 'text/markdown;charset=utf-8';
        break;
    }
    
    return {
      ok: true,
      compiled: {
        content,
        fileName: `${sanitizeId(projectName)}${ext}`,
        mimeType: mime,
        docCount: selectedDocs.length,
      },
    };
  } catch (err) {
    console.error('[compile] compile-project hatası:', err);
    return { ok: false, error: err.message };
  }
});

/**
 * save-compiled-file: Kullanıcıya Save Dialog gösterip diska yazar.
 * payload = { content, fileName, filterName?, extensions? }
 */
ipcMain.handle('save-compiled-file', async (_evt, payload) => {
  try {
    const { content, fileName, filterName = 'Tüm Dosyalar', extensions = ['*'] } = payload || {};
    
    if (!fileName) throw new Error('save-compiled-file: fileName zorunludur.');
    
    const result = await dialog.showSaveDialog({
      title: 'Derlenmiş Projeyi Kaydet',
      defaultPath: fileName,
      filters: [{ name: filterName, extensions }],
    });
    
    if (result.canceled || !result.filePath) {
      return { ok: false, canceled: true };
    }
    
    await fs.writeFile(result.filePath, content ?? '', 'utf8');
    
    return { ok: true, path: result.filePath };
  } catch (err) {
    console.error('[compile] save-compiled-file hatası:', err);
    return { ok: false, error: err.message };
  }
});

module.exports = {
  registerCompileHandlers: () => {}, // zaten yukarıda tanımlandı
};
