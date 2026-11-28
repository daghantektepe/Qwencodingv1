/**
 * FAZ 126 - Yedekleme & Kurtarma Servisi
 * Otomatik snapshot, rotasyon (max N), doğrulama, restore ve dışa aktarma.
 * Tarayıcı (localStorage) ve Electron (IPC bridge) ortamlarında çalışır.
 */

import { channels, invoke, isDesktop } from './ipcBridge';
import {
  openProject,
  saveProject,
  type Project,
} from './projectLifecycle';

export type BackupEntry = {
  id: string;
  projectId: string;
  label: string;
  content: string;
  title: string;
  createdAt: number;
  size: number;
};

export type BackupExportFormat = 'md' | 'json';

export type BackupResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const STORAGE_KEY = 'scrivener:backups';
const MAX_BACKUPS_PER_PROJECT = 5;

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as Crypto).randomUUID();
  }
  return `bk-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readAll(): BackupEntry[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidBackup);
  } catch {
    return [];
  }
}

function writeAll(entries: BackupEntry[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* quota errors ignored */
  }
}

function isValidBackup(value: unknown): value is BackupEntry {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    v.id.length > 0 &&
    typeof v.projectId === 'string' &&
    v.projectId.length > 0 &&
    typeof v.label === 'string' &&
    typeof v.content === 'string' &&
    typeof v.title === 'string' &&
    typeof v.createdAt === 'number' &&
    Number.isFinite(v.createdAt) &&
    typeof v.size === 'number' &&
    Number.isFinite(v.size) &&
    v.size >= 0
  );
}

export function validateBackup(raw: unknown): BackupResult<BackupEntry> {
  if (!isValidBackup(raw)) {
    return { ok: false, error: 'Geçersiz yedek kaydı (şema uyumsuz)' };
  }
  return { ok: true, data: raw };
}

function rotateForProject(entries: BackupEntry[], projectId: string): BackupEntry[] {
  const mine = entries
    .filter((e) => e.projectId === projectId)
    .sort((a, b) => b.createdAt - a.createdAt);
  if (mine.length <= MAX_BACKUPS_PER_PROJECT) return entries;
  const keepIds = new Set(mine.slice(0, MAX_BACKUPS_PER_PROJECT).map((e) => e.id));
  return entries.filter(
    (e) => e.projectId !== projectId || keepIds.has(e.id),
  );
}

export type CreateBackupInput = {
  projectId: string;
  title?: string;
  content: string;
  label?: string;
  createdAt?: number;
};

export async function createBackup(
  input: CreateBackupInput,
): Promise<BackupResult<BackupEntry>> {
  if (!input.projectId) return { ok: false, error: 'projectId zorunludur' };
  if (typeof input.content !== 'string') {
    return { ok: false, error: 'content string olmalıdır' };
  }

  const entry: BackupEntry = {
    id: makeId(),
    projectId: input.projectId,
    title: input.title ?? 'Untitled',
    label: input.label ?? 'Manuel yedek',
    content: input.content,
    createdAt: input.createdAt ?? Date.now(),
    size: input.content.length,
  };

  if (isDesktop()) {
    const res = await invoke<BackupEntry>('backup:create', entry);
    if (res.ok && res.data) return { ok: true, data: res.data };
  }

  const all = readAll();
  all.push(entry);
  const rotated = rotateForProject(all, entry.projectId);
  writeAll(rotated);
  return { ok: true, data: entry };
}

export async function listBackups(projectId: string): Promise<BackupEntry[]> {
  if (isDesktop()) {
    const res = await invoke<BackupEntry[]>('backup:list', { projectId });
    if (res.ok && Array.isArray(res.data)) {
      return res.data.filter(isValidBackup);
    }
  }
  return readAll()
    .filter((e) => e.projectId === projectId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function restoreBackup(
  backupId: string,
): Promise<BackupResult<Project>> {
  if (!backupId) return { ok: false, error: 'backupId zorunludur' };

  let backup: BackupEntry | undefined;

  if (isDesktop()) {
    const res = await invoke<BackupEntry>('backup:get', { id: backupId });
    if (res.ok && res.data) backup = res.data;
  }

  if (!backup) {
    backup = readAll().find((e) => e.id === backupId);
  }

  if (!backup) return { ok: false, error: 'Yedek bulunamadı' };

  const check = validateBackup(backup);
  if (!check.ok) return { ok: false, error: check.error };

  const project = await openProject(backup.projectId);
  if (!project) return { ok: false, error: 'İlgili proje bulunamadı' };

  const restored: Project = {
    ...project,
    content: backup.content,
    updatedAt: Date.now(),
  };
  const saved = await saveProject(restored);
  if (!saved) return { ok: false, error: 'Geri yükleme kalıcılaştırılamadı' };

  return { ok: true, data: restored };
}

export function clearBackupsForTest(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function slugify(input: string): string {
  const base = (input || 'untitled')
    .toLowerCase()
    .trim()
    .replace(/[çğıöşü]/g, (ch) => {
      const map: Record<string, string> = {
        ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u',
      };
      return map[ch] ?? ch;
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'untitled';
}

export function buildExportFilename(
  title: string,
  format: BackupExportFormat,
  when: Date = new Date(),
): string {
  const yyyy = when.getFullYear();
  const mm = String(when.getMonth() + 1).padStart(2, '0');
  const dd = String(when.getDate()).padStart(2, '0');
  return `${slugify(title)}-${yyyy}${mm}${dd}.${format}`;
}

export async function exportAs(
  projectId: string,
  format: BackupExportFormat,
  when: Date = new Date(),
): Promise<BackupResult<{ filename: string; content: string }>> {
  if (!projectId) return { ok: false, error: 'projectId zorunludur' };
  if (format !== 'md' && format !== 'json') {
    return { ok: false, error: `Desteklenmeyen format: ${format}` };
  }

  const project = await openProject(projectId);
  if (!project) return { ok: false, error: 'Proje bulunamadı' };

  if (typeof project.content !== 'string' || project.content.trim().length === 0) {
    return { ok: false, error: 'Boş içerik dışa aktarılamaz' };
  }

  const filename = buildExportFilename(project.title, format, when);
  const content =
    format === 'json'
      ? JSON.stringify(
          {
            id: project.id,
            title: project.title,
            content: project.content,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            exportedAt: when.toISOString(),
          },
          null,
          2,
        )
      : `# ${project.title}\n\n${project.content}\n`;

  if (isDesktop()) {
    const res = await invoke<{ filename: string; content: string }>(
      channels.projectExport,
      { projectId, format, filename, content },
    );
    if (res.ok && res.data) return { ok: true, data: res.data };
  }

  return { ok: true, data: { filename, content } };
}

export const BACKUP_LIMITS = {
  MAX_BACKUPS_PER_PROJECT,
  STORAGE_KEY,
} as const;
