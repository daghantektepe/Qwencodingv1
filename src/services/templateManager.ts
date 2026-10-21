/**
 * templateManager.ts — Faz 45: Proje Şablon Motoru ve Yazım Sihirbazı Yöneticisi
 */

import { ProjectTemplate, TemplateFolderNode } from '../types/templates';
import { novelPreset } from '../templates/presets/novelPreset';
import { academicPreset } from '../templates/presets/academicPreset';
import { screenplayPreset } from '../templates/presets/screenplayPreset';

const blankPreset: ProjectTemplate = {
  id: 'preset-blank',
  name: 'Boş Proje (Standart)',
  category: 'general',
  description: 'Hiçbir hazır yapı içermeyen, tamamen sıfırdan oluşturulacak sade başlangıç.',
  icon: '📄',
  version: '1.0.0',
  rootNodes: [
    {
      id: 'node-blank-draft',
      title: 'Taslak',
      type: 'folder',
      children: [
        {
          id: 'node-blank-doc-1',
          title: 'Yeni Doküman',
          type: 'document',
          content: '',
        },
      ],
    },
    {
      id: 'node-blank-research',
      title: 'Araştırma & Notlar',
      type: 'folder',
      children: [],
    },
  ],
};

class TemplateManager {
  private customTemplates: Map<string, ProjectTemplate> = new Map();
  private storageKey = 'openscriv:templates:custom';

  constructor() {
    this.loadCustomTemplates();
  }

  private loadCustomTemplates(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed: ProjectTemplate[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.customTemplates.clear();
          parsed.forEach((t) => this.customTemplates.set(t.id, t));
        }
      }
    } catch {
      // JSON parse fallback
    }
  }

  private saveCustomTemplates(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const list = Array.from(this.customTemplates.values());
      localStorage.setItem(this.storageKey, JSON.stringify(list));
    } catch {
      // Storage error fallback
    }
  }

  public getBuiltinTemplates(): ProjectTemplate[] {
    return [novelPreset, academicPreset, screenplayPreset, blankPreset];
  }

  public getCustomTemplates(): ProjectTemplate[] {
    return Array.from(this.customTemplates.values());
  }

  public getAllTemplates(): ProjectTemplate[] {
    return [...this.getBuiltinTemplates(), ...this.getCustomTemplates()];
  }

  public getTemplateById(id: string): ProjectTemplate | null {
    const builtin = this.getBuiltinTemplates().find((t) => t.id === id);
    if (builtin) return builtin;
    return this.customTemplates.get(id) || null;
  }

  public saveCustomTemplate(data: Omit<ProjectTemplate, 'id' | 'isCustom' | 'version'>): ProjectTemplate {
    const id = `custom-tmpl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const template: ProjectTemplate = {
      ...data,
      id,
      isCustom: true,
      version: '1.0.0',
    };

    this.customTemplates.set(id, template);
    this.saveCustomTemplates();
    return template;
  }

  public deleteCustomTemplate(id: string): boolean {
    const deleted = this.customTemplates.delete(id);
    if (deleted) {
      this.saveCustomTemplates();
    }
    return deleted;
  }

  public exportTemplateToJson(id: string): string | null {
    const template = this.getTemplateById(id);
    if (!template) return null;
    return JSON.stringify(template, null, 2);
  }

  public importTemplateFromJson(jsonString: string): ProjectTemplate | null {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.name || !Array.isArray(parsed.rootNodes)) {
        return null;
      }
      return this.saveCustomTemplate({
        name: parsed.name,
        category: 'custom',
        description: parsed.description || 'İçe aktarılan özel şablon',
        icon: parsed.icon || '📁',
        targetAudience: parsed.targetAudience,
        rootNodes: parsed.rootNodes,
        targets: parsed.targets,
      });
    } catch {
      return null;
    }
  }

  /**
   * Generates a fresh instance of the template nodes with unique IDs
   */
  public instantiateTemplate(templateId: string): TemplateFolderNode[] {
    const template = this.getTemplateById(templateId);
    if (!template) return [];

    const cloneWithNewIds = (nodes: TemplateFolderNode[]): TemplateFolderNode[] => {
      return nodes.map((node) => {
        const newId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        return {
          ...node,
          id: newId,
          children: node.children ? cloneWithNewIds(node.children) : undefined,
        };
      });
    };

    return cloneWithNewIds(template.rootNodes);
  }

  public clearCustomTemplates(): void {
    this.customTemplates.clear();
    this.saveCustomTemplates();
  }
}

export const templateManager = new TemplateManager();
export default templateManager;
