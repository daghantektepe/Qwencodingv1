/**
 * Native Project Package (.opscriv) IPC Handler
 * Phase 102: Yerel Dosya Sistemi ve Özgün Proje Paketi Formatı (.opscriv)
 */

const { ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');

function computeHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function sanitizeFileName(name) {
  if (!name || typeof name !== 'string') return '';
  return path.basename(name).replace(/[^a-zA-Z0-9_\-\. ]/g, '_');
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

  // 2) Yeni .opscriv Paketi Oluşturma
  ipcMain.handle('project:create-package', async (_event, payload) => {
    try {
      const { parentDir, projectName, initialTree, initialDocs } = payload;
      if (!parentDir || !projectName) {
        throw new Error('parentDir ve projectName zorunludur.');
      }

      const cleanProjectName = sanitizeFileName(projectName);
      if (!cleanProjectName) throw new Error('Geçersiz proje adı.');

      const safeName = cleanProjectName.endsWith('.opscriv') ? cleanProjectName : `${cleanProjectName}.opscriv`;
      const resolvedParent = path.resolve(parentDir);
      const packagePath = assertPathWithinRoot(path.join(resolvedParent, safeName), resolvedParent);

      // Klasör yapısını kur
      await ensureDir(packagePath);
      await ensureDir(path.join(packagePath, 'docs'));
      await ensureDir(path.join(packagePath, 'assets'));
      await ensureDir(path.join(packagePath, 'snapshots'));
      await ensureDir(path.join(packagePath, 'trash'));

      const now = new Date().toISOString();
      const manifest = {
        name: cleanProjectName.replace(/\.opscriv$/, ''),
        formatVersion: '2.1',
        createdAt: now,
        updatedAt: now,
        generator: 'OpenScriv v2.1 Desktop Mastery',
        checksum: '',
      };

      const binder = initialTree || [
        {
          id: 'manuscript_root',
          title: 'Taslak (Manuscript)',
          type: 'folder',
          children: [
            { id: 'doc_1', title: 'Bölüm 1', type: 'document' },
          ],
        },
      ];

      const binderStr = JSON.stringify(binder, null, 2);
      manifest.checksum = computeHash(binderStr);

      await writeAtomic(path.join(packagePath, 'manifest.json'), JSON.stringify(manifest, null, 2));
      await writeAtomic(path.join(packagePath, 'binder.json'), binderStr);

      // Başlangıç belgelerini yaz
      if (Array.isArray(initialDocs)) {
        for (const doc of initialDocs) {
          if (doc.id) {
            const safeId = sanitizeDocId(doc.id);
            if (safeId) {
              const safeDocPath = assertPathWithinRoot(path.join(packagePath, 'docs', `${safeId}.md`), packagePath);
              await writeAtomic(safeDocPath, doc.content || '');
            }
          }
        }
      } else {
        await writeAtomic(
          path.join(packagePath, 'docs', 'doc_1.md'),
          '# Bölüm 1\n\nBuraya hikayenizi yazmaya başlayın...'
        );
      }

      return { ok: true, packagePath, manifest };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // 3) .opscriv Paketini Açma ve Yükleme
  ipcMain.handle('project:read-package', async (_event, { packagePath }) => {
    try {
      if (!packagePath) throw new Error('packagePath zorunludur.');

      const resolvedPackage = path.resolve(packagePath);
      const manifestPath = assertPathWithinRoot(path.join(resolvedPackage, 'manifest.json'), resolvedPackage);
      const binderPath = assertPathWithinRoot(path.join(resolvedPackage, 'binder.json'), resolvedPackage);
      const docsDir = assertPathWithinRoot(path.join(resolvedPackage, 'docs'), resolvedPackage);

      const manifestRaw = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestRaw);

      let binder = [];
      try {
        binder = JSON.parse(await fs.readFile(binderPath, 'utf8'));
      } catch (e) {
        binder = [];
      }

      const docFiles = await fs.readdir(docsDir);
      const documents = {};
      for (const file of docFiles) {
        if (file.endsWith('.md')) {
          const docId = path.basename(file, '.md');
          const safeDocPath = assertPathWithinRoot(path.join(docsDir, file), resolvedPackage);
          documents[docId] = await fs.readFile(safeDocPath, 'utf8');
        }
      }

      return {
        ok: true,
        packagePath: resolvedPackage,
        manifest,
        binder,
        documents,
      };
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
  writeAtomic,
  computeHash,
  sanitizeFileName,
  sanitizeDocId,
  assertPathWithinRoot,
};
