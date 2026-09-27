/**
 * OpenScriv - Faz 11: Proje geneli tam metin arama (main process)
 *
 * Tamamen yerel: Documents/OpenScrivProjects/<projectId>/docs/*.md dosyalari
 * taranir. Bulut/indeks sunucusu yoktur; kucuk projeler icin dogrusal tarama
 * yeterlidir (gerekirse ileride in-memory indeks eklenir).
 *
 * Ozellikler:
 *  - Turkce-duyarli normalizasyon (I/i, s/S, c/C... locale-aware lowercase)
 *  - Buyuk/kucuk harf duyarsiz arama
 *  - Eslesen kelime cevrelerinde snippet (baglam) uretimi
 *  - Sonuclar eslesme sayisina gore siralanir
 */

const path = require('path');
const fs = require('fs/promises');
const { app, ipcMain } = require('electron');

const PROJECTS_DIR_NAME = 'OpenScrivProjects';

// ---------------------------------------------------------------------------
// Yardimcilar
// ---------------------------------------------------------------------------

function getProjectsRoot() {
  return path.join(app.getPath('documents'), PROJECTS_DIR_NAME);
}

function sanitizeId(rawId) {
  // Dosya adi enjeksiyonunu onlemek icin yalnizca guvenli karakterlere izin ver
  return String(rawId).replace(/[^a-zA-Z0-9_-]/g, '_');
}

function docsDir(projectId) {
  return path.join(getProjectsRoot(), sanitizeId(projectId), 'docs');
}

/**
 * Turkce uyumlu kucuk harfe cevirme.
 * Ornegin "ISTANBUL" -> "istanbul", "I" -> "ı" gibi dogru eslemeler icin
 * once ozel harfleri manuel esliyoruz.
 */
const TR_MAP = {
  İ: 'i', I: 'ı', Ş: 'ş', S: 's', C: 'c', Ç: 'ç',
  Ö: 'ö', O: 'o', Ü: 'ü', U: 'u', G: 'ğ', Ğ: 'ğ',
};

function trLowercase(str) {
  return String(str ?? '')
    .split('')
    .map((ch) => (TR_MAP[ch] !== undefined ? TR_MAP[ch] : ch))
    .join('')
    .toLowerCase();
}

/**
 * Normalizasyon: arama sirasinda aksan/tur farklarini yumusatmak icin.
 * Ornegin "kullaniyor" ile "kullanıyor" eslesin diye 'ı'->'i', 'ş'->'s',
 * 'ğ'->'g', 'ü'->'u', 'ö'->'o', 'ç'->'c' sadelestirmesi uygulanir.
 */
function foldForSearch(str) {
  const lower = trLowercase(str);
  const map = { ı: 'i', ş: 's', ğ: 'g', ü: 'u', ö: 'o', ç: 'c', â: 'a', î: 'i', û: 'u', ô: 'o' };
  return lower.replace(/[ışğüöçâîûô]/g, (ch) => map[ch] || ch);
}

/**
 * Bir metinde query'nin tum eslesme indekslerini bulur (fold edilmis halde).
 * @returns {number[]} matchStart indeksleri (fold'lanmis metne gore)
 */
function findAllIndexes(foldedText, foldedQuery) {
  const idxs = [];
  if (!foldedQuery) return idxs;
  let pos = foldedText.indexOf(foldedQuery);
  while (pos !== -1) {
    idxs.push(pos);
    pos = foldedText.indexOf(foldedQuery, pos + foldedQuery.length);
  }
  return idxs;
}

/**
 * Eslesme noktasi etrafinda baglam parcası (snippet) uretir.
 */
function makeSnippet(text, center, queryLen, radius = 60) {
  const start = Math.max(0, center - radius);
  const end = Math.min(text.length, center + queryLen + radius);
  let snip = text.slice(start, end).replace(/\s+/g, ' ').trim();
  if (start > 0) snip = '…' + snip;
  if (end < text.length) snip = snip + '…';
  return snip;
}

// ---------------------------------------------------------------------------
// Arama mantigi
// ---------------------------------------------------------------------------

/**
 * Basit dogrusal tarama: her aramada dosyalari diskten okur.
 * Kucuk/orta boy projeler icin yeterli; buyuk projelerde cache eklenebilir.
 */
async function searchProjectFiles({ projectId, query, maxResults = 50, caseSensitive = false }) {
  try {
    if (!projectId) throw new Error('search: projectId zorunludur.');
    const q = String(query ?? '').trim();
    if (!q) return { ok: true, results: [], query: '' };

    const dir = docsDir(projectId);
    let files = [];
    try {
      files = await fs.readdir(dir);
    } catch (err) {
      if (err.code === 'ENOENT') return { ok: true, results: [] }; // henuz dokuman yok
      throw err;
    }
    const mdFiles = files.filter((f) => f.endsWith('.md'));

    const foldedQuery = caseSensitive ? q : foldForSearch(q);
    const results = [];

    for (const f of mdFiles) {
      const docId = path.basename(f, '.md');
      let content = '';
      try {
        content = await fs.readFile(path.join(dir, f), 'utf8');
      } catch {
        continue; // okunamayan dosyayi atla
      }

      const haystack = caseSensitive ? content : foldForSearch(content);
      const indexes = findAllIndexes(haystack, foldedQuery);
      if (indexes.length === 0) continue;

      // Ilk 3 eslesme icin snippet uret
      const snippets = indexes.slice(0, 3).map((idx) => ({
        text: makeSnippet(content, idx, q.length),
        position: idx,
      }));

      results.push({
        docId,
        title: docId, // baslik renderer tarafinda agactan cozulur
        matchCount: indexes.length,
        snippets,
      });

      if (results.length >= maxResults * 2) break; // asiri buyuk taramayi sinirla
    }

    // Eslesme sayisina gore azalan sirala
    results.sort((a, b) => b.matchCount - a.matchCount);

    return { ok: true, results: results.slice(0, maxResults), query: q };
  } catch (err) {
    console.error('[search] arama hatası:', err);
    return { ok: false, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// IPC kaydi
// ---------------------------------------------------------------------------

/**
 * main.js icinden cagrilir: registerSearchHandlers()
 * Kanallar:
 *   'search-project' -> { projectId, query, maxResults?, caseSensitive? }
 */
function registerSearchHandlers() {
  ipcMain.handle('search-project', async (_evt, payload) => {
    return searchProjectFiles(payload || {});
  });
}

module.exports = {
  registerSearchHandlers,
  searchProjectFiles,
  foldForSearch,
  trLowercase,
};
