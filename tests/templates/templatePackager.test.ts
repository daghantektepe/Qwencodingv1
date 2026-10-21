import { describe, it, expect, beforeEach } from 'vitest';
import { TemplatePackager } from '../../src/services/templates/templatePackager';

describe('Phase 67: Custom Project Templates Studio (templatePackager)', () => {
  let packager: TemplatePackager;

  beforeEach(() => {
    packager = new TemplatePackager();
  });

  it('provides built-in templates (novel and screenplay)', () => {
    const builtIns = packager.getBuiltInTemplates();
    expect(builtIns.length).toBeGreaterThanOrEqual(2);

    const novel = builtIns.find((t) => t.category === 'novel');
    expect(novel).toBeDefined();
    expect(novel?.name).toContain('3 Perdeli');
    expect(novel?.structure.length).toBeGreaterThan(0);
  });

  it('saves custom templates and lists them', () => {
    const custom = packager.saveCustomTemplate({
      name: 'Polisiye Kurgu Şablonu',
      category: 'custom',
      description: 'Gizem ve dedektiflik romanları için.',
      icon: '🕵️',
      author: 'Agatha',
      version: '1.0.0',
      sampleTargetWords: 60000,
      structure: [
        {
          title: 'Cinayet ve Olay Yeri',
          type: 'folder',
          children: [
            { title: 'Cesedin Bulunuşu', type: 'document', synopsis: 'Dedektif olay yerine gelir.' },
          ],
        },
      ],
    });

    expect(custom.id).toBeDefined();
    expect(custom.category).toBe('custom');

    const all = packager.getAllTemplates();
    expect(all.some((t) => t.id === custom.id)).toBe(true);
  });

  it('exports and imports .osctemplate JSON successfully', () => {
    const custom = packager.saveCustomTemplate({
      name: 'Mikro Roman',
      category: 'custom',
      description: 'Kısa anlatı',
      icon: '⚡',
      author: 'Test',
      version: '1.0.0',
      structure: [{ title: 'Sahne 1', type: 'document' }],
    });

    const json = packager.exportTemplateFile(custom.id);
    expect(json).toContain('Mikro Roman');
    expect(json).toContain('OpenScriv-Template');

    packager.clear();
    const imported = packager.importTemplateFile(json);
    expect(imported.name).toBe('Mikro Roman');
    expect(imported.structure).toHaveLength(1);
  });

  it('instantiates template into flattened binder nodes with parent links', () => {
    const builtIns = packager.getBuiltInTemplates();
    const novelId = builtIns[0].id;

    const binderNodes = packager.instantiateTemplate(novelId);
    expect(binderNodes.length).toBeGreaterThan(5);

    const first = binderNodes[0];
    expect(first.title).toBe('Taslak');
    expect(first.type).toBe('folder');
    expect(first.parentTitle).toBeNull();

    const act1 = binderNodes.find((n) => n.title === 'I. Perde (Giriş)');
    expect(act1).toBeDefined();
    expect(act1?.parentTitle).toBe('Taslak');
  });

  it('deletes custom templates cleanly', () => {
    const t = packager.saveCustomTemplate({
      name: 'Silinecek',
      category: 'custom',
      description: '',
      icon: '',
      author: '',
      version: '',
      structure: [],
    });

    expect(packager.getAllTemplates().some((item) => item.id === t.id)).toBe(true);
    packager.deleteCustomTemplate(t.id);
    expect(packager.getAllTemplates().some((item) => item.id === t.id)).toBe(false);
  });
});
