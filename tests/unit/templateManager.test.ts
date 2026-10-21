import { describe, it, expect, beforeEach } from 'vitest';
import { templateManager } from '../../src/services/templateManager';

describe('templateManager', () => {
  beforeEach(() => {
    templateManager.clearCustomTemplates();
  });

  it('should return builtin presets', () => {
    const builtins = templateManager.getBuiltinTemplates();
    expect(builtins.length).toBeGreaterThanOrEqual(4);

    const ids = builtins.map((t) => t.id);
    expect(ids).toContain('preset-novel-three-act');
    expect(ids).toContain('preset-academic-thesis');
    expect(ids).toContain('preset-screenplay-feature');
    expect(ids).toContain('preset-blank');
  });

  it('should retrieve a template by its ID', () => {
    const novel = templateManager.getTemplateById('preset-novel-three-act');
    expect(novel).not.toBeNull();
    expect(novel?.name).toContain('Klasik Roman');
    expect(novel?.category).toBe('fiction');
    expect(novel?.rootNodes.length).toBeGreaterThan(0);
  });

  it('should instantiate template with new unique IDs', () => {
    const nodes = templateManager.instantiateTemplate('preset-novel-three-act');
    expect(nodes.length).toBeGreaterThan(0);

    // Should generate new unique IDs for root and children
    const rootId = nodes[0].id;
    expect(rootId).toMatch(/^doc-/);

    if (nodes[0].children && nodes[0].children.length > 0) {
      const childId = nodes[0].children[0].id;
      expect(childId).toMatch(/^doc-/);
      expect(childId).not.toBe(rootId);
    }
  });

  it('should save and retrieve custom templates', () => {
    const created = templateManager.saveCustomTemplate({
      name: 'Özel Şiir Kitabı',
      category: 'poetry',
      description: 'Dörtlük ve serbest ölçü için şablon',
      icon: '✒️',
      rootNodes: [
        {
          id: 'node-1',
          title: '1. Kısım: Aşk Şiirleri',
          type: 'folder',
          children: [{ id: 'poem-1', title: 'İlk Şiir', type: 'document', content: '' }],
        },
      ],
    });

    expect(created.id).toMatch(/^custom-tmpl-/);
    expect(created.isCustom).toBe(true);

    const found = templateManager.getTemplateById(created.id);
    expect(found).not.toBeNull();
    expect(found?.name).toBe('Özel Şiir Kitabı');

    const customs = templateManager.getCustomTemplates();
    expect(customs).toHaveLength(1);
  });

  it('should export and import custom templates via JSON', () => {
    const created = templateManager.saveCustomTemplate({
      name: 'İhraç Edilecek Şablon',
      category: 'general',
      description: 'JSON testi',
      icon: '📦',
      rootNodes: [{ id: 'n1', title: 'Bölüm 1', type: 'document' }],
    });

    const json = templateManager.exportTemplateToJson(created.id);
    expect(json).not.toBeNull();
    expect(json).toContain('İhraç Edilecek Şablon');

    // Import as new template
    const imported = templateManager.importTemplateFromJson(json!);
    expect(imported).not.toBeNull();
    expect(imported?.name).toBe('İhraç Edilecek Şablon');
    expect(imported?.isCustom).toBe(true);
  });

  it('should delete a custom template', () => {
    const created = templateManager.saveCustomTemplate({
      name: 'Silinecek Şablon',
      category: 'general',
      description: 'Silinecek',
      icon: '🗑',
      rootNodes: [],
    });

    expect(templateManager.getCustomTemplates()).toHaveLength(1);

    const deleted = templateManager.deleteCustomTemplate(created.id);
    expect(deleted).toBe(true);
    expect(templateManager.getCustomTemplates()).toHaveLength(0);
  });
});
