/**
 * taxonomyStore.ts — Faz 72: Gelişmiş Etiket ve Renk Kodlama Deposu
 */

import {
  TaxonomyTag,
  DocumentTaxonomyMapping,
  TaxonomyCategory,
  ColorStripStyle,
  TaxonomyFilter
} from '../../types/taxonomy';

const DEFAULT_TAGS: TaxonomyTag[] = [
  { id: 'tag-pov-sherlock', name: 'Sherlock (POV)', category: 'pov', color: '#38bdf8', description: 'Ana dedektif bakış açısı' },
  { id: 'tag-pov-watson', name: 'Watson (POV)', category: 'pov', color: '#fbbf24', description: 'Yardımcı dedektif anlatıcı' },
  { id: 'tag-loc-london', name: 'Londra / Baker St.', category: 'location', color: '#94a3b8', description: 'Şehir merkezi mekanı' },
  { id: 'tag-loc-countryside', name: 'Kırsal Malikane', category: 'location', color: '#10b981', description: 'Kırsal gizem mekanı' },
  { id: 'tag-theme-betrayal', name: 'İhanet & Yalan', category: 'theme', color: '#f43f5e', description: 'Tematik gerilim motifi' },
  { id: 'tag-theme-redemption', name: 'Fidye & Kurtuluş', category: 'theme', color: '#a855f7', description: 'Kurtuluş motifi' },
];

export class TaxonomyStore {
  private tags: Map<string, TaxonomyTag> = new Map();
  private docMappings: Map<string, DocumentTaxonomyMapping> = new Map();
  private listeners = new Set<() => void>();

  constructor() {
    this.initDefaultTags();
  }

  private initDefaultTags(): void {
    DEFAULT_TAGS.forEach((t) => this.tags.set(t.id, { ...t }));
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  public createTag(data: Omit<TaxonomyTag, 'id'>): TaxonomyTag {
    const id = `tag-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const tag: TaxonomyTag = { ...data, id };
    this.tags.set(id, tag);
    this.notify();
    return tag;
  }

  public updateTag(id: string, updates: Partial<TaxonomyTag>): void {
    const existing = this.tags.get(id);
    if (!existing) return;
    Object.assign(existing, updates);
    this.notify();
  }

  public deleteTag(id: string): void {
    this.tags.delete(id);
    // İlişkili tüm belgelerden bu etiketi çıkar
    for (const mapping of this.docMappings.values()) {
      mapping.tagIds = mapping.tagIds.filter((tid) => tid !== id);
    }
    this.notify();
  }

  public getTags(category?: TaxonomyCategory): TaxonomyTag[] {
    const all = Array.from(this.tags.values());
    if (!category) return all;
    return all.filter((t) => t.category === category);
  }

  public getTag(id: string): TaxonomyTag | undefined {
    return this.tags.get(id);
  }

  public assignTagsToDoc(
    docId: string,
    tagIds: string[],
    colorStripStyle: ColorStripStyle = 'left_border',
    primaryColor?: string
  ): DocumentTaxonomyMapping {
    const mapping: DocumentTaxonomyMapping = {
      docId,
      tagIds: Array.from(new Set(tagIds)),
      colorStripStyle,
      primaryColor: primaryColor || (tagIds.length > 0 ? this.tags.get(tagIds[0])?.color : undefined),
    };
    this.docMappings.set(docId, mapping);
    this.notify();
    return mapping;
  }

  public addTagToDoc(docId: string, tagId: string): void {
    let mapping = this.docMappings.get(docId);
    if (!mapping) {
      mapping = {
        docId,
        tagIds: [tagId],
        colorStripStyle: 'left_border',
        primaryColor: this.tags.get(tagId)?.color,
      };
      this.docMappings.set(docId, mapping);
    } else {
      if (!mapping.tagIds.includes(tagId)) {
        mapping.tagIds.push(tagId);
        if (!mapping.primaryColor) {
          mapping.primaryColor = this.tags.get(tagId)?.color;
        }
      }
    }
    this.notify();
  }

  public removeTagFromDoc(docId: string, tagId: string): void {
    const mapping = this.docMappings.get(docId);
    if (!mapping) return;
    mapping.tagIds = mapping.tagIds.filter((id) => id !== tagId);
    if (mapping.primaryColor === this.tags.get(tagId)?.color) {
      mapping.primaryColor = mapping.tagIds.length > 0 ? this.tags.get(mapping.tagIds[0])?.color : undefined;
    }
    this.notify();
  }

  public getDocTags(docId: string): TaxonomyTag[] {
    const mapping = this.docMappings.get(docId);
    if (!mapping) return [];
    return mapping.tagIds.map((id) => this.tags.get(id)).filter(Boolean) as TaxonomyTag[];
  }

  public getDocMapping(docId: string): DocumentTaxonomyMapping | undefined {
    return this.docMappings.get(docId);
  }

  public filterDocs(docIds: string[], filter: TaxonomyFilter): string[] {
    return docIds.filter((docId) => {
      const mapping = this.docMappings.get(docId);
      const docTags = this.getDocTags(docId);

      // Kategori filtresi
      if (filter.category && filter.category !== 'all') {
        const hasCategory = docTags.some((t) => t.category === filter.category);
        if (!hasCategory) return false;
      }

      // Spesifik etiket filtreleri
      if (filter.tagIds && filter.tagIds.length > 0) {
        const hasAllTags = filter.tagIds.every((tid) => mapping?.tagIds.includes(tid));
        if (!hasAllTags) return false;
      }

      // Arama filtresi
      if (filter.searchQuery && filter.searchQuery.trim().length > 0) {
        const q = filter.searchQuery.toLowerCase();
        const matches = docTags.some((t) => t.name.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }

  public clear(): void {
    this.tags.clear();
    this.docMappings.clear();
    this.notify();
  }
}

export const taxonomyStore = new TaxonomyStore();
export default taxonomyStore;
