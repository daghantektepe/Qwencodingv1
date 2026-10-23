/**
 * Tests for Native Project Store & .opscriv Packaging
 * Phase 102: Yerel Dosya Sistemi ve Özgün Proje Paketi Formatı (.opscriv)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NativeProjectStore } from '../../src/services/native/nativeProjectStore';

describe('Phase 102: Native Project Store (.opscriv Packaging & Atomic Persistence)', () => {
  beforeEach(() => {
    // Reset window.electronAPI mock
    window.electronAPI = {
      invoke: vi.fn(async (channel: string, payload?: any) => {
        if (channel === 'project:pick-directory') {
          return { canceled: false, path: 'D:/Kitaplarim' };
        }
        if (channel === 'project:create-package') {
          return {
            ok: true,
            packagePath: `${payload.parentDir}/${payload.projectName}.opscriv`,
            manifest: {
              name: payload.projectName,
              formatVersion: '2.1',
              createdAt: '2026-10-24T00:00:00Z',
              updatedAt: '2026-10-24T00:00:00Z',
              generator: 'OpenScriv v2.0 Desktop Mastery',
              checksum: 'mock_sha256_hash',
            },
          };
        }
        if (channel === 'project:read-package') {
          return {
            ok: true,
            packagePath: payload.packagePath,
            manifest: {
              name: 'Roman Taslağı',
              formatVersion: '2.1',
              createdAt: '2026-10-24T00:00:00Z',
              updatedAt: '2026-10-24T00:00:00Z',
              generator: 'OpenScriv v2.0 Desktop Mastery',
            },
            binder: [
              { id: 'root', title: 'Manuscript', children: [{ id: 'doc_1', title: 'Giriş' }] },
            ],
            documents: {
              doc_1: '# Giriş\n\nGüneş batarken şehir sessizliğe büründü.',
            },
          };
        }
        if (channel === 'project:save-doc-atomic') {
          return {
            ok: true,
            docId: payload.docId,
            path: `${payload.packagePath}/docs/${payload.docId}.md`,
            savedAt: 1792798000,
          };
        }
        if (channel === 'project:save-binder-atomic') {
          return {
            ok: true,
            path: `${payload.packagePath}/binder.json`,
          };
        }
        return { ok: true };
      }),
    } as any;
  });

  it('picks project directory using native dialog via IPC', async () => {
    const dir = await NativeProjectStore.pickDirectory({ title: 'Proje Yeri Seç' });
    expect(dir).toBe('D:/Kitaplarim');
  });

  it('creates .opscriv package with atomic manifest and initial docs', async () => {
    const res = await NativeProjectStore.createPackage({
      parentDir: 'D:/Kitaplarim',
      projectName: 'Kayıp_Yıldızlar',
    });

    expect(res.ok).toBe(true);
    expect(res.data?.packagePath).toBe('D:/Kitaplarim/Kayıp_Yıldızlar.opscriv');
    expect(res.data?.manifest.formatVersion).toBe('2.1');
    expect(res.data?.binder).toBeDefined();
    expect(res.data?.documents.doc_1).toContain('Bölüm 1');
  });

  it('returns error when creating project with empty project name', async () => {
    const res = await NativeProjectStore.createPackage({
      projectName: '   ',
    });

    expect(res.ok).toBe(false);
    expect(res.error).toBe('Proje adı boş olamaz.');
  });

  it('opens and parses existing .opscriv package directory', async () => {
    const res = await NativeProjectStore.openPackage('D:/Kitaplarim/Roman.opscriv');

    expect(res.ok).toBe(true);
    expect(res.data?.manifest.name).toBe('Roman Taslağı');
    expect(res.data?.binder[0].title).toBe('Manuscript');
    expect(res.data?.documents.doc_1).toContain('Güneş batarken');
  });

  it('saves document atomically without corruption risk', async () => {
    const saveRes = await NativeProjectStore.saveDocumentAtomic(
      'D:/Kitaplarim/Roman.opscriv',
      'doc_1',
      'Yeni güncellenmiş metin içeriği'
    );

    expect(saveRes.ok).toBe(true);
    expect(saveRes.path).toContain('doc_1.md');
    expect(saveRes.savedAt).toBe(1792798000);
  });

  it('saves binder tree atomically and updates package metadata', async () => {
    const newBinder = [
      { id: 'ch1', title: 'Bölüm 1', type: 'document' },
      { id: 'ch2', title: 'Bölüm 2', type: 'document' },
    ];
    const binderRes = await NativeProjectStore.saveBinderAtomic(
      'D:/Kitaplarim/Roman.opscriv',
      newBinder
    );

    expect(binderRes.ok).toBe(true);
    expect(binderRes.path).toContain('binder.json');
  });

  it('validates package integrity and reports errors for malformed packages', () => {
    const validCheck = NativeProjectStore.validatePackageIntegrity(
      {
        name: 'Valid Project',
        formatVersion: '2.1',
        createdAt: '2026-10-24',
        updatedAt: '2026-10-24',
        generator: 'OpenScriv',
      },
      []
    );
    expect(validCheck.valid).toBe(true);
    expect(validCheck.errors).toHaveLength(0);

    const invalidCheck = NativeProjectStore.validatePackageIntegrity(
      {
        name: '',
        formatVersion: '',
        createdAt: '',
        updatedAt: '',
        generator: '',
      },
      'not_an_array' as any
    );
    expect(invalidCheck.valid).toBe(false);
    expect(invalidCheck.errors.length).toBeGreaterThan(1);
  });
});
