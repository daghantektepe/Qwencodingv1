import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NativeProjectStore } from '../../src/services/native/nativeProjectStore';

describe('Native .opscriv Package Round-Trip & IPC Integrity (Faz 5)', () => {
  let mockFsStorage: Record<string, string> = {};

  beforeEach(() => {
    mockFsStorage = {};
    (window as any).electronAPI = {
      invoke: vi.fn().mockImplementation(async (channel: string, payload: any) => {
        if (channel === 'project:create-package') {
          const { parentDir, projectName, initialTree, initialDocs } = payload;
          const pkgPath = `${parentDir}/${projectName}.opscriv`;
          mockFsStorage[`${pkgPath}/manifest.json`] = JSON.stringify({
            name: projectName,
            formatVersion: '2.1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            generator: 'OpenScriv Test',
          });
          mockFsStorage[`${pkgPath}/binder.json`] = JSON.stringify(initialTree || []);
          if (Array.isArray(initialDocs)) {
            for (const doc of initialDocs) {
              mockFsStorage[`${pkgPath}/docs/${doc.id}.md`] = doc.content || '';
            }
          }
          return {
            ok: true,
            packagePath: pkgPath,
            manifest: JSON.parse(mockFsStorage[`${pkgPath}/manifest.json`]),
          };
        }

        if (channel === 'project:read-package') {
          const { packagePath } = payload;
          const manifestRaw = mockFsStorage[`${packagePath}/manifest.json`];
          if (!manifestRaw) return { ok: false, error: 'Paket bulunamadı.' };

          const manifest = JSON.parse(manifestRaw);
          const binder = JSON.parse(mockFsStorage[`${packagePath}/binder.json`] || '[]');
          const documents: Record<string, string> = {};

          for (const [key, val] of Object.entries(mockFsStorage)) {
            if (key.startsWith(`${packagePath}/docs/`) && key.endsWith('.md')) {
              const docId = key.replace(`${packagePath}/docs/`, '').replace('.md', '');
              documents[docId] = val;
            }
          }

          return {
            ok: true,
            packagePath,
            manifest,
            binder,
            documents,
          };
        }

        if (channel === 'project:save-doc-atomic') {
          const { packagePath, docId, content } = payload;
          mockFsStorage[`${packagePath}/docs/${docId}.md`] = content;
          return { ok: true, docId, savedAt: Date.now() };
        }

        if (channel === 'project:save-binder-atomic') {
          const { packagePath, binder } = payload;
          mockFsStorage[`${packagePath}/binder.json`] = JSON.stringify(binder);
          return { ok: true, path: `${packagePath}/binder.json` };
        }

        return { ok: false, error: 'Bilinmeyen kanal' };
      }),
    };
  });

  it('creates project, saves document atomically, saves binder, and reopens with exact data', async () => {
    // 1) Yeni temiz proje paketi oluştur
    const initialTree = [
      {
        id: 'folder-manuscript',
        type: 'folder',
        title: 'Taslak',
        children: [{ id: 'doc-chapter-1', type: 'doc', title: 'Bölüm 1' }],
      },
    ];
    const initialDocs = [{ id: 'doc-chapter-1', content: '# Başlangıç\n\nİlk cümle.' }];

    const createRes = await NativeProjectStore.createPackage({
      parentDir: 'C:/Users/Author/Documents/OpenScriv',
      projectName: 'Kuzey Masalı',
      initialTree,
      initialDocs,
    });

    expect(createRes.ok).toBe(true);
    expect(createRes.data?.packagePath).toBe('C:/Users/Author/Documents/OpenScriv/Kuzey Masalı.opscriv');

    const pkgPath = createRes.data!.packagePath;

    // 2) Belgeyi atomik olarak güncelle
    const saveDocRes = await NativeProjectStore.saveDocumentAtomic(
      pkgPath,
      'doc-chapter-1',
      '# Başlangıç\n\nGüncellenmiş yeni sahne metni.'
    );
    expect(saveDocRes.ok).toBe(true);

    // 3) Binder ağacına yeni sahne ekle ve atomik kaydet
    const updatedTree = [
      {
        id: 'folder-manuscript',
        type: 'folder',
        title: 'Taslak',
        children: [
          { id: 'doc-chapter-1', type: 'doc', title: 'Bölüm 1' },
          { id: 'doc-chapter-2', type: 'doc', title: 'Bölüm 2' },
        ],
      },
    ];
    const saveBinderRes = await NativeProjectStore.saveBinderAtomic(pkgPath, updatedTree);
    expect(saveBinderRes.ok).toBe(true);

    // 4) Paketi tekrar aç ve verilerin birebir korunduğunu doğrula
    const openRes = await NativeProjectStore.openPackage(pkgPath);
    expect(openRes.ok).toBe(true);
    expect(openRes.data?.manifest.name).toBe('Kuzey Masalı');
    expect(openRes.data?.binder.length).toBe(1);
    expect(openRes.data?.binder[0].children.length).toBe(2);
    expect(openRes.data?.documents['doc-chapter-1']).toBe('# Başlangıç\n\nGüncellenmiş yeni sahne metni.');
  });

  it('validates package integrity with manifest and binder structure', () => {
    const validManifest = {
      name: 'Test Projesi',
      formatVersion: '2.1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generator: 'OpenScriv',
    };
    const validBinder = [{ id: 'doc-1', title: 'Bölüm 1', type: 'doc' }];

    const check = NativeProjectStore.validatePackageIntegrity(validManifest, validBinder);
    expect(check.valid).toBe(true);
    expect(check.errors).toEqual([]);

    // Eksik manifest testi
    const brokenCheck = NativeProjectStore.validatePackageIntegrity({} as any, 'gecersiz-binder' as any);
    expect(brokenCheck.valid).toBe(false);
    expect(brokenCheck.errors.length).toBeGreaterThan(0);
  });
});
