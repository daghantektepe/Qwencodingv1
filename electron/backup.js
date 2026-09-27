/**
 * OpenScriv - Faz 14: Dayaniklilik — Otomatik yedekleme & çökme kurtarma
 *
 * Tamamen yerel, dosya tabanlı yedekleme motoru (bulut yok):
 *   1) Debounce'lu otomatik kayıt: markDirty(projectId) → DEFAULT_DEBOUNCE_MS içinde
 *      bir kez snapshot alınır.
 *   2) Periyodik yedek: startPeriodicBackup() → setInterval ile aralıklı kontrol;
 *      kirli proje varsa yedekler.
 *   3) Döngüsel saklama (retention): proje başına en fazla MAX_BACKUPS adet
 *      .json tutulur; eskiler silinir.
 *   4) Çökme kurtarma: crash-recovery.json imleci — yazma öncesi "pending",
 *      başarılı yazma sonrası "committed" işaretlenir; uygulama açılışında
 *      getCrashRecoveryInfo() ile yarım kalan işlem / son iyi yedek tespit edilir.
 *
 * Depolama yapısı:
 *   userData/backups/<projectId>/
 *     backup-<timestamp>.json   → tam proje verisi + metadata
 *     index.json                → yedek listesi (id, timestamp, size, docCount)
 *     crash-recovery.json       → { status:'pending'|'committed', ... } imleci
 *
 * Kullanım (main.js):
 *   const { registerBackupHandlers, initBackups } = require('./backup');
 *   initBackups();            // periyodik kontrolleri başlatır
 *   registerBackupHandlers(); // IPC kanallarını kaydeder
 */

const path = require('path');
const fs = require('fs/promises');
const { app, ipcMain } = require('electron');

// ---------------------------------------------------------------------------
// Sabitler
// ---------------------------------------------------------------------------

const DEFAULT_DEBOUNCE_MS = 5000; // degisiklikten ~5 sn sonra otomatik yedek
const MAX_BACKUPS = 10;           // dondurulmus surum sayisi (eski→yeni rotasyon)
const PERIODIC_INTERVAL_MS = 30_000; // periyodik kontrol araligi

// ---------------------------------------------------------------------------
// Yol yardimcilari
// ---------------------------------------------------------------------------

function sanitizeId(rawId) {
  return String(rawId).replace(/[^a-zA-Z0-9_-]/g, '_');
}

function getBackupsRoot() {
  return path.join(app.getPath('userData'), 'backups');
}

function getProjectBackupDir(projectId) {
  return path.join(getBackupsRoot(), sanitizeId(projectId));
}

function getIndexPath(projectId) {
  return path.join(getProjectBackupDir(projectId), 'index.json');
}

function getCrashRecoveryPath(projectId) {
  return path.join(getProjectBackupDir(projectId), 'crash-recovery.json');
}

function getBackupFilePath(projectId, timestamp) {
  return path.join(getProjectBackupDir(projectId), `backup-${timestamp}.json`);
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function readJsonSafe(p, fallback) {
  try {
    const raw = await fs.readFile(p, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * Atomik yazim: once .tmp yaz, sonra rename. Yaris kosulunu azaltir.
 */
async function writeJsonAtomic(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmpPath, filePath);
}

// ---------------------------------------------------------------------------
// Crash-recovery imleci
// ---------------------------------------------------------------------------

async function markPending(projectId, meta = {}) {
  await writeJsonAtomic(getCrashRecoveryPath(projectId), {
    status: 'pending',
    projectId,
    updatedAt: Date.now(),
    ...meta,
  });
}

async function markCommitted(projectId, timestamp) {
  await writeJsonAtomic(getCrashRecoveryPath(projectId), {
    status: 'committed',
    projectId,
    lastGoodBackup: timestamp,
    updatedAt: Date.now(),
  });
}

/**
 * Uygulama açılışında çağrılır: yarım kalmış bir yedekleme var mı?
 * pending + bugün içinden commit edilmemiş kayıt → muhtemel çökme izi.
 */
async function getCrashRecoveryInfo(projectId) {
  const info = await readJsonSafe(getCrashRecoveryPath(projectId), null);
  if (!info) {
    return { hasCrashEvidence: false, reason: 'no-recovery-file' };
  }
  if (info.status === 'pending') {
    const index = await readIndex(projectId);
    const latest = index[0] || null;
    return {
      hasCrashEvidence: true,
      reason: 'pending-write-interrupted',
      pendingAt: info.updatedAt,
      latestGoodBackup: latest ? { timestamp: latest.timestamp, file: getBackupFilePath(projectId, latest.timestamp) } : null,
    };
  }
  return { hasCrashEvidence: false, reason: 'clean', lastGoodBackup: info.lastGoodBackup };
}

// ---------------------------------------------------------------------------
// Index (yedek listesi)
// ---------------------------------------------------------------------------

async function readIndex(projectId) {
  const idx = await readJsonSafe(getIndexPath(projectId), []);
  return Array.isArray(idx) ? idx : [];
}

async function writeIndex(projectId, entries) {
  await writeJsonAtomic(getIndexPath(projectId), entries);
}

// ---------------------------------------------------------------------------
// Yedekleme çekirdeği
// ---------------------------------------------------------------------------

/**
 * Belirli bir projenin TAMAMINI diskten okuyup tek JSON olarak yedekler.
 * Proje verisi convention: Documents/OpenScrivProjects/<id>/project.json
 * (+ docs/*.md). project.json yoksa docs klasörünü tarayıp ağaç üretiriz.
 */
async function createBackupForProject(projectId) {
  try {
    if (!projectId) throw new Error('createBackup: projectId zorunludur.');

    const timestamp = Date.now();

    // 1) Kaynak veriyi oku
    const projectsRoot = path.join(app.getPath('documents'), 'OpenScrivProjects');
    const projDir = path.join(projectsRoot, sanitizeId(projectId));
    const projectJsonPath = path.join(projDir, 'project.json');

    let projectData = null;
    if (await fileExists(projectJsonPath)) {
      projectData = await readJsonSafe(projectJsonPath, null);
    } else {
      // project.json yoksa docs/*.md'den minimal bir veri topla
      const docsDir = path.join(projDir, 'docs');
      const files = await fs.readdir(docsDir).catch(() => []);
      const docs = [];
      for (const f of files.filter((x) => x.endsWith('.md'))) {
        const content = await fs.readFile(path.join(docsDir, f), 'utf8').catch(() => '');
        docs.push({ id: path.basename(f, '.md'), type: 'doc', title: path.basename(f, '.md'), content });
      }
      projectData = { id: projectId, tree: docs, exportedAt: Date.now() };
    }

    if (!projectData) throw new Error('Yedeklenecek proje verisi bulunamadı.');

    // 2) Crash imlecini pending yap
    await markPending(projectId, { intendedTimestamp: timestamp });

    // 3) Yedek dosyasını atomik yaz
    const payload = {
      schemaVersion: 1,
      projectId,
      timestamp,
      createdAt: new Date(timestamp).toISOString(),
      data: projectData,
    };
    const backupPath = getBackupFilePath(projectId, timestamp);
    await writeJsonAtomic(backupPath, payload);

    // 4) Index'e ekle (en yeni başta)
    let index = await readIndex(projectId);
    index.unshift({
      timestamp,
      file: path.basename(backupPath),
      size: Buffer.byteLength(JSON.stringify(payload), 'utf8'),
      docCount: countDocsInPayload(payload),
    });

    // 5) Retention: en fazla MAX_BACKUPS tut, eskileri sil
    if (index.length > MAX_BACKUPS) {
      const removed = index.slice(MAX_BACKUPS);
      index = index.slice(0, MAX_BACKUPS);
      for (const r of removed) {
        try {
          await fs.unlink(path.join(getProjectBackupDir(projectId), r.file));
        } catch {
          /* zaten yoksa sorun değil */
        }
      }
    }
    await writeIndex(projectId, index);

    // 6) Commit imleci — bu noktadan sonra veri güvenli
    await markCommitted(projectId, timestamp);

    return {
      ok: true,
      backup: { timestamp, file: path.basename(backupPath), kept: index.length },
    };
  } catch (err) {
    console.error('[backup] createBackupForProject hatası:', err);
    return { ok: false, error: err.message };
  }
}

function countDocsInPayload(payload) {
  let n = 0;
  const walk = (nodes) => {
    for (const node of nodes || []) {
      if (node.type === 'doc') n += 1;
      if (node.type === 'folder' && Array.isArray(node.children)) walk(node.children);
    }
  };
  walk(payload?.data?.tree || payload?.data?.docs || []);
  return n;
}

/**
 * Listeler: belirli bir projenin tüm yedekleri (yeniden eskiye).
 */
async function listBackups(projectId) {
  try {
    const index = await readIndex(projectId);
    return { ok: true, backups: index };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Bir yedeğin tam içeriğini okur (geri yükleme önizlemesi için).
 */
async function loadBackup({ projectId, timestamp }) {
  try {
    if (!projectId || !timestamp) throw new Error('loadBackup: projectId ve timestamp zorunludur.');
    const p = getBackupFilePath(projectId, timestamp);
    if (!(await fileExists(p))) throw new Error('Yedek bulunamadı.');
    const payload = await readJsonSafe(p, null);
    if (!payload) throw new Error('Yedek dosyası okunamadı/bozuk.');
    return { ok: true, backup: payload };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Geri yükleme: seçili yedeği ONCE "pre-restore" yedegi alip sonra
 * proje dosyasina yazar. Boylece geri yukleme bile geri alinabilir.
 */
async function restoreBackup({ projectId, timestamp }) {
  try {
    if (!projectId || !timestamp) throw new Error('restoreBackup: projectId ve timestamp zorunludur.');
    const p = getBackupFilePath(projectId, timestamp);
    if (!(await fileExists(p))) throw new Error('Yedek bulunamadı.');
    const payload = await readJsonSafe(p, null);
    if (!payload?.data) throw new Error('Yedek bozuk.');

    // Emniyet: mevcut durumu "pre-restore" olarak yedekle
    await createBackupForProject(projectId);

    // Projeyi geri yaz
    const projectsRoot = path.join(app.getPath('documents'), 'OpenScrivProjects');
    const projDir = path.join(projectsRoot, sanitizeId(projectId));
    await fs.mkdir(projDir, { recursive: true });
    await writeJsonAtomic(path.join(projDir, 'project.json'), payload.data);

    return { ok: true, restoredFrom: timestamp };
  } catch (err) {
    console.error('[backup] restoreBackup hatası:', err);
    return { ok: false, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Otomatik kayıt (debounce) + periyodik yedek
// ---------------------------------------------------------------------------

const dirtyTimers = new Map(); // projectId -> timeout handle
const dirtyFlags = new Set();  // periyodik kontrol icin kirli projeler

/**
 * Renderer her kaydetmede/degisiklikte bunu cagrir:
 * 'backup:mark-dirty' → debounce surei sonunda otomatik yedek alinir.
 */
function markDirty(projectId, debounceMs = DEFAULT_DEBOUNCE_MS) {
  if (!projectId) return { ok: false, error: 'markDirty: projectId gerekli' };
  dirtyFlags.add(projectId);
  if (dirtyTimers.has(projectId)) clearTimeout(dirtyTimers.get(projectId));
  const handle = setTimeout(async () => {
    dirtyTimers.delete(projectId);
    dirtyFlags.delete(projectId);
    const res = await createBackupForProject(projectId);
    if (!res.ok) console.warn('[backup] otomatik yedek başarısız:', res.error);
  }, debounceMs);
  // Electron kapanirken timer'ın süreci tutmasını engelle
  if (typeof handle.unref === 'function') handle.unref();
  dirtyTimers.set(projectId, handle);
  return { ok: true, scheduledIn: debounceMs };
}

let periodicTimer = null;

/**
 * Periyodik saglamalama: interval'da kirli kalmis (debounce'u yakalanamis)
 * projeleri tekrar kontrol eder; bekleyen timer yoksa hemen yedekler.
 */
function startPeriodicBackup(intervalMs = PERIODIC_INTERVAL_MS) {
  stopPeriodicBackup();
  periodicTimer = setInterval(async () => {
    for (const pid of [...dirtyFlags]) {
      if (!dirtyTimers.has(pid)) {
        dirtyFlags.delete(pid);
        await createBackupForProject(pid);
      }
    }
  }, intervalMs);
  if (typeof periodicTimer.unref === 'function') periodicTimer.unref();
  return { ok: true, intervalMs };
}

function stopPeriodicBackup() {
  if (periodicTimer) {
    clearInterval(periodicTimer);
    periodicTimer = null;
  }
}

/**
 * Uygulama kapanirken bekleyen debounce'lari senkron olmasa da flush etmeye calis.
 * main.js'te 'before-quit' icinde await edilebilir.
 */
async function flushPendingBackups() {
  const pendings = [...dirtyTimers.keys()];
  for (const pid of pendings) {
    clearTimeout(dirtyTimers.get(pid));
    dirtyTimers.delete(pid);
    dirtyFlags.delete(pid);
    await createBackupForProject(pid);
  }
  return { ok: true, flushed: pendings.length };
}

function initBackups() {
  startPeriodicBackup();
}

// ---------------------------------------------------------------------------
// IPC handler'lari
// ---------------------------------------------------------------------------

/**
 * Kanallar:
 *   'backup:create'        → { projectId } | projectId string
 *   'backup:list'          → { projectId }
 *   'backup:load'          → { projectId, timestamp }
 *   'backup:restore'       → { projectId, timestamp }
 *   'backup:mark-dirty'    → { projectId, debounceMs? }
 *   'backup:crash-info'    → { projectId }
 *   'backup:flush-pending' → {}
 */
function registerBackupHandlers() {
  ipcMain.handle('backup:create', async (_e, arg) => {
    const projectId = typeof arg === 'string' ? arg : arg?.projectId;
    return createBackupForProject(projectId);
  });

  ipcMain.handle('backup:list', async (_e, arg) => {
    const projectId = typeof arg === 'string' ? arg : arg?.projectId;
    return listBackups(projectId);
  });

  ipcMain.handle('backup:load', async (_e, arg) => loadBackup(arg || {}));

  ipcMain.handle('backup:restore', async (_e, arg) => restoreBackup(arg || {}));

  ipcMain.handle('backup:mark-dirty', async (_e, arg) => {
    const projectId = typeof arg === 'string' ? arg : arg?.projectId;
    const debounceMs = typeof arg === 'object' ? arg?.debounceMs : undefined;
    return markDirty(projectId, debounceMs);
  });

  ipcMain.handle('backup:crash-info', async (_e, arg) => {
    const projectId = typeof arg === 'string' ? arg : arg?.projectId;
    return getCrashRecoveryInfo(projectId);
  });

  ipcMain.handle('backup:flush-pending', async () => flushPendingBackups());
}

module.exports = {
  // sabitler
  DEFAULT_DEBOUNCE_MS,
  MAX_BACKUPS,
  PERIODIC_INTERVAL_MS,
  // yasam dongusu
  initBackups,
  registerBackupHandlers,
  startPeriodicBackup,
  stopPeriodicBackup,
  flushPendingBackups,
  // cekirdek API
  createBackupForProject,
  listBackups,
  loadBackup,
  restoreBackup,
  markDirty,
  getCrashRecoveryInfo,
  // test yardimcilari
  _internals: { sanitizeId, getProjectBackupDir, writeJsonAtomic, countDocsInPayload },
};
