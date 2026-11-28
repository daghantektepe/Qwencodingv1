/**
 * FAZ 126 - Yedekleme & Kurtarma Uçtan Uca Testi
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';

import BackupPanel from '../src/components/BackupPanel';
import {
  createBackup,
  listBackups,
  restoreBackup,
  validateBackup,
  buildExportFilename,
  exportAs,
  clearBackupsForTest,
  BACKUP_LIMITS,
} from '../src/services/backupService';
import {
  createProject,
  writeContent,
  saveProject,
  openProject,
  clearProjectsForTest,
} from '../src/services/projectLifecycle';

function removeBridge(): void {
  delete (window as unknown as { electronAPI?: unknown }).electronAPI;
}

describe('FAZ 126 - Yedekleme & Kurtarma', () => {
  beforeEach(() => {
    removeBridge();
    clearBackupsForTest();
    clearProjectsForTest();
  });

  afterEach(() => {
    cleanup();
    removeBridge();
    clearBackupsForTest();
    clearProjectsForTest();
  });

  it('anlık yedek oluşturur ve listede görünür', async () => {
    const project = await createProject('Yedek Projesi');
    await writeContent(project.id, 'ilk içerik');
    await saveProject({ ...project, content: 'ilk içerik' });

    const res = await createBackup({
      projectId: project.id,
      title: project.title,
      content: 'ilk içerik',
      label: 'v1',
    });
    expect(res.ok).toBe(true);

    const list = await listBackups(project.id);
    expect(list.length).toBe(1);
    expect(list[0].label).toBe('v1');
    expect(list[0].content).toBe('ilk içerik');
  });

  it('bozuk yedek kaydını validateBackup reddeder', () => {
    expect(validateBackup(null).ok).toBe(false);
    expect(validateBackup({ id: '' }).ok).toBe(false);
    expect(
      validateBackup({
        id: 'x',
        projectId: 'p',
        label: 'l',
        title: 't',
        content: 'c',
        createdAt: 1,
        size: 1,
      }).ok,
    ).toBe(true);
  });

  it('rotasyon: 5 sınırını aşan yedeklerde en eskiyi atar', async () => {
    const project = await createProject('Rotasyon');
    for (let i = 0; i < 8; i += 1) {
      const res = await createBackup({
        projectId: project.id,
        title: project.title,
        content: `içerik-${i}`,
        label: `s${i}`,
        createdAt: 1000 + i,
      });
      expect(res.ok).toBe(true);
    }
    const list = await listBackups(project.id);
    expect(list.length).toBe(BACKUP_LIMITS.MAX_BACKUPS_PER_PROJECT);
    const labels = list.map((b) => b.label).sort();
    // En yeni 5 yedek korunmuş olmalı (s3, s4, s5, s6, s7)
    expect(labels).toEqual(['s3', 's4', 's5', 's6', 's7']);
  });

  it('belirli bir yedeğe geri dönüldüğünde proje içeriği eşitlenir', async () => {
    const project = await createProject('Geri Yükle');
    await writeContent(project.id, 'mevcut');
    await saveProject({ ...project, content: 'mevcut' });

    const snapshot = await createBackup({
      projectId: project.id,
      title: project.title,
      content: 'yedeklenmiş sürüm',
      label: 'eski',
    });
    expect(snapshot.ok).toBe(true);
    if (!snapshot.ok) return;

    // Araya daha yeni bir içerik yazalım.
    await writeContent(project.id, 'yeni');
    await saveProject({ ...project, content: 'yeni' });

    const restore = await restoreBackup(snapshot.data.id);
    expect(restore.ok).toBe(true);

    const reopened = await openProject(project.id);
    expect(reopened?.content).toBe('yedeklenmiş sürüm');
  });

  it('var olmayan yedeğe geri yükleme hata döner', async () => {
    const res = await restoreBackup('nope');
    expect(res.ok).toBe(false);
  });

  it('exportAs .md ve .json formatlarını üretir', async () => {
    const project = await createProject('Export Projesi');
    await writeContent(project.id, 'gövde metni');
    await saveProject({ ...project, content: 'gövde metni' });

    const md = await exportAs(project.id, 'md', new Date('2024-05-06'));
    expect(md.ok).toBe(true);
    if (md.ok) {
      expect(md.data.filename.endsWith('.md')).toBe(true);
      expect(md.data.filename).toContain('20240506');
      expect(md.data.content).toContain('gövde metni');
      expect(md.data.content.startsWith('# Export Projesi')).toBe(true);
    }

    const json = await exportAs(project.id, 'json', new Date('2024-05-06'));
    expect(json.ok).toBe(true);
    if (json.ok) {
      expect(json.data.filename.endsWith('.json')).toBe(true);
      const parsed = JSON.parse(json.data.content);
      expect(parsed.content).toBe('gövde metni');
      expect(parsed.title).toBe('Export Projesi');
    }
  });

  it('boş içerik export edilemez', async () => {
    const project = await createProject('Boş');
    const res = await exportAs(project.id, 'md');
    expect(res.ok).toBe(false);
  });

  it('buildExportFilename slug + tarih üretir', () => {
    const fn = buildExportFilename('Merhaba Dünya', 'md', new Date('2024-01-02'));
    expect(fn).toBe('merhaba-dunya-20240102.md');
  });

  it('BackupPanel üzerinden oluştur + geri yükle uçtan uca çalışır', async () => {
    const project = await createProject('Panel Projesi');
    await writeContent(project.id, 'panel içerik');
    await saveProject({ ...project, content: 'panel içerik' });

    const restoredContents: string[] = [];
    render(
      React.createElement(BackupPanel, {
        projectId: project.id,
        projectTitle: project.title,
        currentContent: 'panel içerik',
        onRestored: (c: string) => restoredContents.push(c),
      }),
    );

    // Yedek oluştur
    fireEvent.click(screen.getByTestId('backup-create'));
    await waitFor(() => {
      expect(screen.getByTestId('backup-status').textContent).toBe('ok');
      expect(screen.getByTestId('backup-message').textContent).toBe('Yedek oluşturuldu');
    });

    // Listede görünmeli
    const list = await listBackups(project.id);
    expect(list.length).toBe(1);
    const entry = list[0];

    await waitFor(() => {
      expect(screen.getByTestId(`backup-item-${entry.id}`)).toBeInTheDocument();
    });

    // Geri Yükle
    fireEvent.click(screen.getByTestId(`backup-restore-${entry.id}`));
    await waitFor(() => {
      expect(screen.getByTestId('backup-message').textContent).toBe('Yedek geri yüklendi');
    });
    expect(restoredContents).toContain('panel içerik');
  });

  it('BackupPanel proje yokken yedek oluşturmayı reddeder', async () => {
    render(React.createElement(BackupPanel, { projectId: null }));
    fireEvent.click(screen.getByTestId('backup-create'));
    await waitFor(() => {
      expect(screen.getByTestId('backup-status').textContent).toBe('error');
    });
    expect(screen.getByTestId('backup-message').textContent).toContain(
      'Önce bir proje oluşturun',
    );
  });

  it('BackupPanel .md export düğmesi çalışır', async () => {
    const project = await createProject('Panel Export');
    await writeContent(project.id, 'içerik');
    await saveProject({ ...project, content: 'içerik' });

    render(
      React.createElement(BackupPanel, {
        projectId: project.id,
        projectTitle: project.title,
        currentContent: 'içerik',
      }),
    );

    fireEvent.click(screen.getByTestId('backup-export-md'));
    await waitFor(() => {
      expect(screen.getByTestId('backup-message').textContent).toContain('Dışa aktarıldı');
      expect(screen.getByTestId('backup-message').textContent).toMatch(/\.md$/);
    });
  });
});
