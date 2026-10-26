/**
 * Native Project Package (.opscriv) IPC Handler
 * Phase 102: Yerel Dosya Sistemi ve Özgün Proje Paketi Formatı (.opscriv)
 */

const { ipcMain, dialog, app } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');

function computeHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Yalnızca dosya sisteminde yasak karakterleri ayıklar; Türkçe ve diğer harfler korunur.
function sanitizeFileName(name) {
  if (!name || typeof name !== 'string') return '';
  return path
    .basename(name)
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .replace(/[. ]+$/g, '')
    .trim();
}

function sanitizeDocId(docId) {
  if (!docId || typeof docId !== 'string') return '';
  return path.basename(docId).replace(/[^a-zA-Z0-9_\-]/g, '_');
}

function assertPathWithinRoot(targetPath, rootDir) {
  const resolvedTarget = path.resolve(targetPath);
  const resolvedRoot = path.resolve(rootDir);
  const relative = path.relative(resolvedRoot, resolvedTarget);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Yol ihlali tespit edildi: Hedef yol (${resolvedTarget}), izin verilen kok dizin (${resolvedRoot}) disinda!`);
  }
  return resolvedTarget;
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function writeAtomic(targetPath, data) {
  const tmpPath = `${targetPath}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
  await ensureDir(path.dirname(targetPath));
  await fs.writeFile(tmpPath, data, 'utf8');
  await fs.rename(tmpPath, targetPath);
}

const isDocNode = (n) => n && (n.type === 'doc' || n.type === 'document');

// Uygulama ağacı (metin dahil) -> binder (yalnızca yapı + metadata) ve belge listesi.
function splitTree(tree) {
  const docs = [];
  const strip = (nodes) =>
    (nodes || []).map((n) => {
      const { content, contentHtml, children, ...rest } = n;
      if (isDocNode(n)) docs.push({ id: n.id, content: content ?? '', contentHtml });
      return Array.isArray(children) ? { ...rest, children: strip(children) } : rest;
    });
  return { binder: strip(tree), docs };
}

// binder + docs/*.md (düz metin) + docs/*.html (biçimli metin) -> uygulama ağacı.
function mergeTree(binder, texts, htmls) {
  const fill = (nodes) =>
    (nodes || []).map((n) => {
      const node = Array.isArray(n.children) ? { ...n, children: fill(n.children) } : { ...n };
      if (isDocNode(node)) {
        const key = sanitizeDocId(node.id);
        node.type = 'doc';
        node.content = texts[key] ?? '';
        if (htmls[key] !== undefined) node.contentHtml = htmls[key];
      }
      return node;
    });
  return fill(binder);
}

// Son yazılan belge içerikleri (paket başına); yalnızca değişen belgeler diske yazılır.
const writtenDocs = new Map();

async function writeDocs(packagePath, docs) {
  const cache = writtenDocs.get(packagePath) || new Map();
  writtenDocs.set(packagePath, cache);
  for (const doc of docs) {
    const safeId = sanitizeDocId(doc.id);
    if (!safeId) continue;
    const key = `${doc.content}\u0000${doc.contentHtml ?? ''}`;
    if (cache.get(safeId) === key) continue;
    const base = path.join(packagePath, 'docs', safeId);
    await writeAtomic(assertPathWithinRoot(`${base}.md`, packagePath), String(doc.content ?? ''));
    const htmlPath = assertPathWithinRoot(`${base}.html`, packagePath);
    if (doc.contentHtml !== undefined) await writeAtomic(htmlPath, String(doc.contentHtml));
    else await fs.rm(htmlPath, { force: true });
    cache.set(safeId, key);
  }
  // ponytail: binder'dan silinen belgelerin dosyaları docs/ içinde kalır (okunurken yok sayılır); çöp kutusu gelince temizlenir.
}

async function readManifest(packagePath) {
  const manifestPath = assertPathWithinRoot(path.join(packagePath, 'manifest.json'), packagePath);
  return { manifestPath, manifest: JSON.parse(await fs.readFile(manifestPath, 'utf8')) };
}

function registerProjectIpcHandlers() {
  // 1) Dizin Seçici Dialog
  ipcMain.handle('project:pick-directory', async (event, options = {}) => {
    try {
      const result = await dialog.showOpenDialog({
        title: options.title || 'OpenScriv Proje Konumu Seçin',
        properties: ['openDirectory', 'createDirectory'],
        buttonLabel: options.buttonLabel || 'Seç',
      });
      return { canceled: result.canceled, path: result.filePaths[0] || null };
    } catch (err) {
      return { error: err.message, canceled: true };
    }
  });

  // Varsayılan proje konumu: Belgeler/OpenScriv
  ipcMain.handle('project:default-dir', () => path.join(app.getPath('documents'), 'OpenScriv'));

  // 2) Yeni .opscriv Paketi Oluşturma
  //    initialTree: uygulama ağacı (metin dahil). Var olan bir paketin üzerine asla yazmaz.
  ipcMain.handle('project:create-package', async (_event, payload) => {
    try {
      const { parentDir, projectName, initialTree } = payload || {};
      if (!parentDir || !projectName) {
        throw new Error('parentDir ve projectName zorunludur.');
      }

      const displayName = String(projectName).trim();
      const cleanProjectName = sanitizeFileName(displayName.replace(/\.opscriv$/i, ''));
      if (!cleanProjectName) throw new Error('Geçersiz proje adı.');

      const resolvedParent = path.resolve(parentDir);
      const packagePath = assertPathWithinRoot(path.join(resolvedParent, `${cleanProjectName}.opscriv`), resolvedParent);
      const exists = await fs.stat(packagePath).then(() => true, () => false);
      if (exists) throw new Error(`Bu konumda "${cleanProjectName}" adlı bir proje zaten var.`);

      for (const dir of ['docs', 'assets', 'snapshots', 'trash']) {
        await ensureDir(path.join(packagePath, dir));
      }

      const { binder, docs } = splitTree(Array.isArray(initialTree) ? initialTree : []);
      const binderStr = JSON.stringify(binder, null, 2);
      const now = new Date().toISOString();
      const manifest = {
        id: crypto.randomUUID(),
        name: displayName.replace(/\.opscriv$/i, ''),
        formatVersion: '2.1',
        createdAt: now,
        updatedAt: now,
        generator: 'OpenScriv',
        checksum: computeHash(binderStr),
      };

      await writeDocs(packagePath, docs);
      await writeAtomic(path.join(packagePath, 'binder.json'), binderStr);
      // manifest en son yazılır: manifest'i olan klasör tam bir pakettir.
      await writeAtomic(path.join(packagePath, 'manifest.json'), JSON.stringify(manifest, null, 2));

      return { ok: true, packagePath, manifest };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // 3) .opscriv Paketini Açma ve Yükleme -> { manifest, tree }
  ipcMain.handle('project:read-package', async (_event, { packagePath } = {}) => {
    try {
      if (!packagePath) throw new Error('packagePath zorunludur.');

      const resolvedPackage = path.resolve(packagePath);
      let read;
      try {
        read = await readManifest(resolvedPackage);
      } catch (err) {
        throw new Error(err.code === 'ENOENT' ? 'Seçilen klasör bir OpenScriv projesi değil (manifest.json yok).' : err.message);
      }
      const { manifestPath, manifest } = read;
      if (!manifest.id) {
        manifest.id = crypto.randomUUID();
        await writeAtomic(manifestPath, JSON.stringify(manifest, null, 2));
      }

      const binderPath = assertPathWithinRoot(path.join(resolvedPackage, 'binder.json'), resolvedPackage);
      // Bozuk binder boş proje gibi açılmaz: ilk kayıt onu ezerdi.
      const binder = JSON.parse(await fs.readFile(binderPath, 'utf8'));

      const docsDir = assertPathWithinRoot(path.join(resolvedPackage, 'docs'), resolvedPackage);
      const texts = {};
      const htmls = {};
      for (const file of await fs.readdir(docsDir).catch(() => [])) {
        const ext = path.extname(file);
        if (ext !== '.md' && ext !== '.html') continue;
        const content = await fs.readFile(assertPathWithinRoot(path.join(docsDir, file), resolvedPackage), 'utf8');
        (ext === '.md' ? texts : htmls)[path.basename(file, ext)] = content;
      }

      const tree = mergeTree(binder, texts, htmls);
      // Diskteki hâli önbelleğe al: açılıştan sonra yalnızca değişen belgeler yazılır.
      writtenDocs.set(resolvedPackage, new Map(splitTree(tree).docs.map((d) => [sanitizeDocId(d.id), `${d.content}\u0000${d.contentHtml ?? ''}`])));

      return { ok: true, packagePath: resolvedPackage, manifest, tree, binder, documents: texts };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // 3b) Tüm projeyi kaydet: { packagePath, name, tree } (yalnızca değişen belgeler yazılır)
  ipcMain.handle('project:save-package', async (_event, { packagePath, name, tree } = {}) => {
    try {
      if (!packagePath || !Array.isArray(tree)) throw new Error('packagePath ve tree zorunludur.');
      const resolvedPackage = path.resolve(packagePath);
      const { manifestPath, manifest } = await readManifest(resolvedPackage);

      const { binder, docs } = splitTree(tree);
      const binderStr = JSON.stringify(binder, null, 2);
      await writeDocs(resolvedPackage, docs);
      await writeAtomic(assertPathWithinRoot(path.join(resolvedPackage, 'binder.json'), resolvedPackage), binderStr);

      if (typeof name === 'string' && name.trim()) manifest.name = name.trim();
      manifest.updatedAt = new Date().toISOString();
      manifest.checksum = computeHash(binderStr);
      await writeAtomic(manifestPath, JSON.stringify(manifest, null, 2));

      return { ok: true, savedAt: Date.now() };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // 4) Atomik Belge Yazma
  ipcMain.handle('project:save-doc-atomic', async (_event, { packagePath, docId, content }) => {
    try {
      if (!packagePath || !docId) throw new Error('packagePath ve docId zorunludur.');

      const resolvedPackage = path.resolve(packagePath);
      const safeId = sanitizeDocId(docId);
      if (!safeId) throw new Error('Geçersiz docId.');

      const docPath = assertPathWithinRoot(path.join(resolvedPackage, 'docs', `${safeId}.md`), resolvedPackage);
      await writeAtomic(docPath, String(content ?? ''));

      // Güncelleme zaman damgasını manifest'e yansıt
      const manifestPath = assertPathWithinRoot(path.join(resolvedPackage, 'manifest.json'), resolvedPackage);
      try {
        const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
        manifest.updatedAt = new Date().toISOString();
        await writeAtomic(manifestPath, JSON.stringify(manifest, null, 2));
      } catch (e) {
        // manifest yazılamasa da doc atomik olarak güvenle kaydedilmiştir
      }

      return { ok: true, docId: safeId, path: docPath, savedAt: Date.now() };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // 5) Atomik Binder Ağacı Yazma
  ipcMain.handle('project:save-binder-atomic', async (_event, { packagePath, binder }) => {
    try {
      if (!packagePath || !binder) throw new Error('packagePath ve binder zorunludur.');

      const resolvedPackage = path.resolve(packagePath);
      const binderPath = assertPathWithinRoot(path.join(resolvedPackage, 'binder.json'), resolvedPackage);
      const binderStr = JSON.stringify(binder, null, 2);
      await writeAtomic(binderPath, binderStr);

      const manifestPath = assertPathWithinRoot(path.join(resolvedPackage, 'manifest.json'), resolvedPackage);
      try {
        const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
        manifest.updatedAt = new Date().toISOString();
        manifest.checksum = computeHash(binderStr);
        await writeAtomic(manifestPath, JSON.stringify(manifest, null, 2));
      } catch (e) {
        // manifest ihmal edilebilir
      }

      return { ok: true, path: binderPath };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });
}

module.exports = {
  registerProjectIpcHandlers,
  splitTree,
  mergeTree,
  writeAtomic,
  computeHash,
  sanitizeFileName,
  sanitizeDocId,
  assertPathWithinRoot,
};
