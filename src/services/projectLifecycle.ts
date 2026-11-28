/**
 * Project Lifecycle Service
 * "Oluştur -> Yaz -> Kaydet -> Kapat -> Aç -> Dışa Aktar" tam yaşam döngüsünü
 * tek bir soyutlama altında toplar. IPC bridge üzerinden Electron'a, yoksa
 * localStorage fallback ile web ortamına yazar.
 */

import { channels, invoke, isDesktop } from './ipcBridge';

export type Project = {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
};

const STORAGE_KEY = 'scrivener:projects';

function readStore(): Project[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Project[]) : [];
  } catch {
    return [];
  }
}

function writeStore(projects: Project[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    /* quota errors ignored */
  }
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as Crypto).randomUUID();
  }
  return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function createProject(title: string): Promise<Project> {
  const now = Date.now();
  const project: Project = {
    id: makeId(),
    title: title || 'Untitled Project',
    content: '',
    createdAt: now,
    updatedAt: now,
  };

  if (isDesktop()) {
    const res = await invoke<Project>(channels.projectCreate, project);
    if (res.ok && res.data) return res.data;
  }

  const projects = readStore();
  projects.push(project);
  writeStore(projects);
  return project;
}

export async function writeContent(id: string, content: string): Promise<boolean> {
  if (isDesktop()) {
    const res = await invoke<boolean>(channels.projectSave, { id, content });
    if (res.ok) return true;
  }
  const projects = readStore();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx < 0) return false;
  projects[idx] = { ...projects[idx], content, updatedAt: Date.now() };
  writeStore(projects);
  return true;
}

export async function saveProject(project: Project): Promise<boolean> {
  if (isDesktop()) {
    const res = await invoke<boolean>(channels.projectSave, project);
    if (res.ok) return true;
  }
  const projects = readStore();
  const idx = projects.findIndex((p) => p.id === project.id);
  const next = { ...project, updatedAt: Date.now() };
  if (idx < 0) projects.push(next);
  else projects[idx] = next;
  writeStore(projects);
  return true;
}

export async function closeProject(id: string): Promise<boolean> {
  if (isDesktop()) {
    const res = await invoke<boolean>(channels.projectClose, { id });
    if (res.ok) return true;
  }
  return true;
}

export async function openProject(id: string): Promise<Project | null> {
  if (isDesktop()) {
    const res = await invoke<Project>(channels.projectOpen, { id });
    if (res.ok && res.data) return res.data;
  }
  const projects = readStore();
  return projects.find((p) => p.id === id) ?? null;
}

export async function exportProject(
  id: string,
  format: 'txt' | 'md' | 'json' = 'txt',
): Promise<{ ok: boolean; payload?: string; error?: string }> {
  if (isDesktop()) {
    const res = await invoke<{ payload: string }>(channels.projectExport, { id, format });
    if (res.ok && res.data) return { ok: true, payload: res.data.payload };
    if (!res.ok) return { ok: false, error: res.error };
  }
  const project = await openProject(id);
  if (!project) return { ok: false, error: 'Project not found' };
  if (format === 'json') return { ok: true, payload: JSON.stringify(project, null, 2) };
  return { ok: true, payload: project.content };
}

export function listProjects(): Project[] {
  return readStore();
}

export function clearProjectsForTest(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
