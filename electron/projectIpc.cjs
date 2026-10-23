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

      const safeName = projectName.endsWith('.opscriv') ? projectName : `${projectName}.opscriv`;
      const packagePath = path.join(parentDir, safeName);

      // Klasör yapısını kur
      await ensureDir(packagePath);
      await ensureDir(path.join(packagePath, 'docs'));
      await ensureDir(path.join(packagePath, 'assets'));
      await ensureDir(path.join(packagePath, 'snapshots'));
      await ensureDir(path.join(packagePath, 'trash'));

      const now = new Date().toISOString();
      const manifest = {
        name: projectName.replace(/\.opscriv$/, ''),
        formatVersion: '2.1',
        createdAt: now,
        updatedAt: now,
        generator: 'OpenScriv v2.0 Desktop Mastery',
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
            await writeAtomic(path.join(packagePath, 'docs', `${doc.id}.md`), doc.content || '');
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

      const manifestPath = path.join(packagePath, 'manifest.json');
      const binderPath = path.join(packagePath, 'binder.json');
      const docsDir = path.join(packagePath, 'docs');

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
          documents[docId] = await fs.readFile(path.join(docsDir, file), 'utf8');
        }
      }

      return {
        ok: true,
        packagePath,
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
      const docPath = path.join(packagePath, 'docs', `${docId}.md`);
      await writeAtomic(docPath, String(content ?? ''));

      // Güncelleme zaman damgasını manifest'e yansıt
      const manifestPath = path.join(packagePath, 'manifest.json');
      try {
        const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
        manifest.updatedAt = new Date().toISOString();
        await writeAtomic(manifestPath, JSON.stringify(manifest, null, 2));
      } catch (e) {
        // manifest yazılamasa da doc atomik olarak güvenle kaydedilmiştir
      }

      return { ok: true, docId, path: docPath, savedAt: Date.now() };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // 5) Atomik Binder Ağacı Yazma
  ipcMain.handle('project:save-binder-atomic', async (_event, { packagePath, binder }) => {
    try {
      if (!packagePath || !binder) throw new Error('packagePath ve binder zorunludur.');
      const binderPath = path.join(packagePath, 'binder.json');
      const binderStr = JSON.stringify(binder, null, 2);
      await writeAtomic(binderPath, binderStr);

      const manifestPath = path.join(packagePath, 'manifest.json');
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
};
