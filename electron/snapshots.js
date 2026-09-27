/**
 * OpenScriv - Faz 10: Snapshots (Doküman Versiyonlama)
 *
 * Bu modul, dokümanların anlık görüntülerini (snapshot) yerel dosya sisteminde
 * tutar. Her snapshot bir JSON dosyası olarak saklanır ve geri yüklenebilir.
 *
 * Yapı:
 *   userData/snapshots/<projectId>/<docId>/
 *     index.json       → tüm snapshot'ların listesi (metadata)
 *     <timestamp>.json → tam içerik + metadata
 *
 * Tamamen yerel; bulut yok. Electron main process içinde çalışır.
 */

const path = require('path');
const fs = require('fs/promises');
const { app } = require('electron');

// Basit ID üretici
function generateSnapshotId() {
  return `snap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Snapshot kök dizinini döndürür.
 */
function getSnapshotsRoot() {
  return path.join(app.getPath('userData'), 'snapshots');
}

/**
 * Belirli bir dokümanın snapshot klasörünü döndürür.
 */
function getDocSnapshotDir(projectId, docId) {
  const safeProject = String(projectId).replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeDoc = String(docId).replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(getSnapshotsRoot(), safeProject, safeDoc);
}

/**
 * Index dosyasının yolu.
 */
function getIndexFilePath(projectId, docId) {
  return path.join(getDocSnapshotDir(projectId, docId), 'index.json');
}

/**
 * Tek bir snapshot dosyasının yolu.
 */
function getSnapshotFilePath(projectId, docId, timestamp) {
  return path.join(getDocSnapshotDir(projectId, docId), `${timestamp}.json`);
}

/**
 * Dizin varsa ve erişilebilirse true döner.
 */
async function dirExists(dirPath) {
  try {
    await fs.access(dirPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Dosya varsa true döner.
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Bir dokümanın mevcut snapshot listesini okur.
 * @param {string} projectId
 * @param {string} docId
 * @returns {Promise<Array<{ id: string, title: string, timestamp: number, size: number }>>}
 */
async function readIndex(projectId, docId) {
  const indexPath = getIndexFilePath(projectId, docId);
  if (!(await fileExists(indexPath))) {
    return [];
  }
  try {
    const raw = await fs.readFile(indexPath, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Snapshot listesini diske yazar.
 */
async function writeIndex(projectId, docId, entries) {
  const dir = getDocSnapshotDir(projectId, docId);
  await fs.mkdir(dir, { recursive: true });
  const indexPath = getIndexFilePath(projectId, docId);
  await fs.writeFile(indexPath, JSON.stringify(entries, null, 2), 'utf8');
}

/**
 * Snapshot alır: dokümanın o anki içeriğini diske kaydeder.
 *
 * @param {Object} payload
 * @param {string} payload.projectId
 * @param {string} payload.docId
 * @param {string} payload.content - dokümanın tam metni
 * @param {string} [payload.title] - opsiyonel başlık
 * @param {string} [payload.note] - kullanıcı notu
 * @returns {Promise<{ ok: boolean, snapshot?: Object, error?: string }>}
 */
async function createSnapshot({ projectId, docId, content, title = '', note = '' }) {
  try {
    if (!projectId || !docId) {
      throw new Error('createSnapshot: projectId ve docId zorunludur.');
    }

    const timestamp = Date.now();
    const id = generateSnapshotId();
    const size = Buffer.byteLength(content || '', 'utf8');

    // Snapshot objesi oluştur
    const snapshot = {
      id,
      projectId,
      docId,
      title: title || `Otomatik ${new Date(timestamp).toLocaleString('tr-TR')}`,
      note,
      timestamp,
      size,
      content, // tam içerik
    };

    // Dosyaya yaz
    const filePath = getSnapshotFilePath(projectId, docId, timestamp);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2), 'utf8');

    // Index'e ekle (en yeni başta)
    let entries = await readIndex(projectId, docId);
    entries.unshift({
      id,
      title: snapshot.title,
      timestamp,
      size,
      note,
    });

    // En fazla 50 snapshot tut (performans için); taşanları sil
    if (entries.length > 50) {
      const toDelete = entries.slice(50);
      for (const entry of toDelete) {
        const p = getSnapshotFilePath(projectId, docId, entry.timestamp);
        try {
          await fs.unlink(p);
        } catch {
          /* dosya zaten yoksa sorun değil */
        }
      }
      entries = entries.slice(0, 50);
    }

    await writeIndex(projectId, docId, entries);

    // Büyük içeriği IPC üzerinden geri gönderme
    const { content: _omit, ...metaOnly } = snapshot;
    return { ok: true, snapshot: metaOnly };
  } catch (err) {
    console.error('[snapshots] createSnapshot hatası:', err);
    return { ok: false, error: err.message };
  }
}

/**
 * Bir dokümanın tüm snapshot'larını listeler.
 *
 * @param {Object} payload
 * @param {string} payload.projectId
 * @param {string} payload.docId
 * @returns {Promise<{ ok: boolean, snapshots?: Array, error?: string }>}
 */
async function listSnapshots({ projectId, docId }) {
  try {
    if (!projectId || !docId) {
      throw new Error('listSnapshots: projectId ve docId zorunludur.');
    }
    const entries = await readIndex(projectId, docId);
    return { ok: true, snapshots: entries };
  } catch (err) {
    console.error('[snapshots] listSnapshots hatası:', err);
    return { ok: false, error: err.message };
  }
}

/**
 * Bir snapshot'ın tam içeriğini okur (geri yükleme öncesi önizleme için).
 *
 * @param {Object} payload
 * @param {string} payload.projectId
 * @param {string} payload.docId
 * @param {number} payload.timestamp - snapshot zaman damgası
 * @returns {Promise<{ ok: boolean, snapshot?: Object, error?: string }>}
 */
async function loadSnapshot({ projectId, docId, timestamp }) {
  try {
    if (!projectId || !docId || !timestamp) {
      throw new Error('loadSnapshot: projectId, docId ve timestamp zorunludur.');
    }
    const filePath = getSnapshotFilePath(projectId, docId, timestamp);
    if (!(await fileExists(filePath))) {
      throw new Error('Snapshot bulunamadı.');
    }
    const raw = await fs.readFile(filePath, 'utf8');
    const snapshot = JSON.parse(raw);
    return { ok: true, snapshot };
  } catch (err) {
    console.error('[snapshots] loadSnapshot hatası:', err);
    return { ok: false, error: err.message };
  }
}

/**
 * Bir snapshot'ı siler.
 *
 * @param {Object} payload
 * @param {string} payload.projectId
 * @param {string} payload.docId
 * @param {number} payload.timestamp
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
async function deleteSnapshot({ projectId, docId, timestamp }) {
  try {
    if (!projectId || !docId || !timestamp) {
      throw new Error('deleteSnapshot: projectId, docId ve timestamp zorunludur.');
    }

    // Dosyayı sil
    const filePath = getSnapshotFilePath(projectId, docId, timestamp);
    if (await fileExists(filePath)) {
      await fs.unlink(filePath);
    }

    // Index'ten çıkar
    let entries = await readIndex(projectId, docId);
    entries = entries.filter((e) => e.timestamp !== timestamp);
    await writeIndex(projectId, docId, entries);

    return { ok: true };
  } catch (err) {
    console.error('[snapshots] deleteSnapshot hatası:', err);
    return { ok: false, error: err.message };
  }
}

/**
 * Bir dokümanın tüm snapshot verilerini temizler (test/debug amaçlı).
 */
async function clearAllSnapshots({ projectId, docId }) {
  try {
    if (!projectId || !docId) {
      throw new Error('clearAllSnapshots: projectId ve docId zorunludur.');
    }
    const dir = getDocSnapshotDir(projectId, docId);
    if (await dirExists(dir)) {
      await fs.rm(dir, { recursive: true, force: true });
    }
    return { ok: true };
  } catch (err) {
    console.error('[snapshots] clearAllSnapshots hatası:', err);
    return { ok: false, error: err.message };
  }
}

module.exports = {
  createSnapshot,
  listSnapshots,
  loadSnapshot,
  deleteSnapshot,
  clearAllSnapshots,
};
