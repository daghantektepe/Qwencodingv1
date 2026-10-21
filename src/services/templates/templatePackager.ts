/**
 * templatePackager.ts — Faz 67: Proje Şablonları Fabrikası ve Paketleyici
 */

export type TemplateCategory = 'novel' | 'screenplay' | 'academic' | 'custom';

export interface OscTemplateItem {
  title: string;
  type: 'folder' | 'document';
  content?: string;
  synopsis?: string;
  children?: OscTemplateItem[];
}

export interface ProjectTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  icon: string;
  author: string;
  version: string;
  structure: OscTemplateItem[];
  sampleTargetWords?: number;
  isBuiltIn?: boolean;
}

const BUILT_IN_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'tpl-3-act-novel',
    name: '3 Perdeli Klasik Roman Şablonu',
    category: 'novel',
    description: 'Syd Field ve Campbell kahramanın yolculuğu mimarisinde 3 Perde, 9 Bölüm ve Karakter Dosyaları.',
    icon: '📖',
    author: 'OpenScriv Studio',
    version: '1.0.0',
    isBuiltIn: true,
    sampleTargetWords: 80000,
    structure: [
      {
        title: 'Taslak',
        type: 'folder',
        children: [
          {
            title: 'I. Perde (Giriş)',
            type: 'folder',
            children: [
              { title: '1. Bölüm: Sıradan Dünya', type: 'document', synopsis: 'Kahramanın günlük hayatı ve statüko.' },
              { title: '2. Bölüm: Maceraya Çağrı', type: 'document', synopsis: 'Olayları başlatan tetikleyici olay (Inciting Incident).' },
              { title: '3. Bölüm: Eşiği Geçiş', type: 'document', synopsis: 'Kahraman geri dönülemez bir karar alır.' },
            ],
          },
          {
            title: 'II. Perde (Gelişme & Çatışma)',
            type: 'folder',
            children: [
              { title: '4. Bölüm: Sınavlar ve Müttefikler', type: 'document' },
              { title: '5. Bölüm: Orta Nokta (Midpoint)', type: 'document', synopsis: 'Büyük aydınlanma veya sahte zafer.' },
              { title: '6. Bölüm: Ruhun Karanlık Gecesi', type: 'document', synopsis: 'Her şeyin kaybedildiği an (All Hope is Lost).' },
            ],
          },
          {
            title: 'III. Perde (Sonuç & Zirve)',
            type: 'folder',
            children: [
              { title: '7. Bölüm: Yeniden Doğuş', type: 'document' },
              { title: '8. Bölüm: Büyük Yüzleşme (Climax)', type: 'document', synopsis: 'Nihai savaş ve antagonistle çatışma.' },
              { title: '9. Bölüm: Yeni Denge (Epilogue)', type: 'document' },
            ],
          },
        ],
      },
      {
        title: 'Karakterler & Notlar',
        type: 'folder',
        children: [
          { title: 'Protagonist Dosyası', type: 'document' },
          { title: 'Antagonist Dosyası', type: 'document' },
        ],
      },
    ],
  },
  {
    id: 'tpl-hollywood-screenplay',
    name: 'Hollywood Standart Senaryo',
    category: 'screenplay',
    description: '110 sayfalık sinema filmi formatı. Beat Sheet, Sahne Dökümü ve Fountain uyumlu iskelet.',
    icon: '🎬',
    author: 'OpenScriv Studio',
    version: '1.0.0',
    isBuiltIn: true,
    sampleTargetWords: 22000,
    structure: [
      {
        title: 'Senaryo',
        type: 'folder',
        children: [
          { title: 'Sekans A: Açılış Görüntüsü', type: 'document' },
          { title: 'Sekans B: Katalizör', type: 'document' },
          { title: 'Sekans C: İkinci Perdeye Geçiş', type: 'document' },
        ],
      },
    ],
  },
];

export class TemplatePackager {
  private customTemplates: Map<string, ProjectTemplate> = new Map();

  public getBuiltInTemplates(): ProjectTemplate[] {
    return BUILT_IN_TEMPLATES;
  }

  public getAllTemplates(): ProjectTemplate[] {
    return [...BUILT_IN_TEMPLATES, ...Array.from(this.customTemplates.values())];
  }

  public saveCustomTemplate(template: Omit<ProjectTemplate, 'id' | 'isBuiltIn'>): ProjectTemplate {
    const id = `tpl-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newTemplate: ProjectTemplate = {
      ...template,
      id,
      category: 'custom',
      isBuiltIn: false,
    };
    this.customTemplates.set(id, newTemplate);
    return newTemplate;
  }

  public exportTemplateFile(id: string): string {
    const template = this.getAllTemplates().find((t) => t.id === id);
    if (!template) throw new Error('Şablon bulunamadı');

    return JSON.stringify(
      {
        format: 'OpenScriv-Template',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        template,
      },
      null,
      2
    );
  }

  public importTemplateFile(jsonString: string): ProjectTemplate {
    try {
      const parsed = JSON.parse(jsonString);
      const tpl = parsed.template || parsed;

      if (!tpl.name || !Array.isArray(tpl.structure)) {
        throw new Error('Geçersiz şablon yapısı');
      }

      const imported = this.saveCustomTemplate({
        name: tpl.name,
        category: 'custom',
        description: tpl.description || 'İçe aktarılan şablon',
        icon: tpl.icon || '📁',
        author: tpl.author || 'Bilinmiyor',
        version: tpl.version || '1.0.0',
        structure: tpl.structure,
        sampleTargetWords: tpl.sampleTargetWords || 50000,
      });

      return imported;
    } catch (e: any) {
      throw new Error(`Şablon içe aktarılamadı: ${e.message}`);
    }
  }

  public deleteCustomTemplate(id: string): void {
    this.customTemplates.delete(id);
  }

  public clear(): void {
    this.customTemplates.clear();
  }

  /**
   * Hiyerarşik şablon yapısını Binder düğümleri listesine dönüştürür
   */
  public instantiateTemplate(
    templateId: string
  ): Array<{ title: string; type: string; content: string; parentTitle: string | null }> {
    const template = this.getAllTemplates().find((t) => t.id === templateId);
    if (!template) throw new Error('Şablon bulunamadı');

    const result: Array<{ title: string; type: string; content: string; parentTitle: string | null }> = [];

    const traverse = (items: OscTemplateItem[], parentTitle: string | null) => {
      for (const item of items) {
        result.push({
          title: item.title,
          type: item.type,
          content: item.content || (item.synopsis ? `<!-- Özet: ${item.synopsis} -->\n\n` : ''),
          parentTitle,
        });

        if (item.children && item.children.length > 0) {
          traverse(item.children, item.title);
        }
      }
    };

    traverse(template.structure, null);
    return result;
  }
}

export const templatePackager = new TemplatePackager();
export default templatePackager;
