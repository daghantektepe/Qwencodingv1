/**
 * compilePresetsStore.ts — Faz 85: Zengin Dışa Aktarma Profilleri Yöneticisi
 */

import { ExportFormat, PageSize, PageOrientation } from '../../types/compile';

export interface CompilePreset {
  id: string;
  name: string;
  description: string;
  format: ExportFormat;
  fontFamily: string;
  fontSizePt: number;
  lineSpacing: number; // 1.0, 1.15, 1.5, 2.0
  pageSize: PageSize;
  orientation: PageOrientation;
  marginsMm: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  firstLineIndentMm: number;
  includeTOC: boolean;
  includeTitlePage: boolean;
  chapterBreak: 'page' | 'separator' | 'none';
  customCss?: string;
  isBuiltIn?: boolean;
}

export const BUILTIN_PRESETS: CompilePreset[] = [
  {
    id: 'kdp-paperback-standard',
    name: 'Amazon KDP Standart Baskı',
    description: 'Amazon KDP ciltsiz kitap (Paperback) için hazır baskı formatı. Garamond 11pt, zarif kenar boşlukları.',
    format: 'pdf',
    fontFamily: 'Garamond, serif',
    fontSizePt: 11,
    lineSpacing: 1.25,
    pageSize: 'a5',
    orientation: 'portrait',
    marginsMm: { top: 19, right: 15, bottom: 19, left: 22 },
    firstLineIndentMm: 5,
    includeTOC: true,
    includeTitlePage: true,
    chapterBreak: 'page',
    isBuiltIn: true,
  },
  {
    id: 'standard-manuscript-shunn',
    name: 'Penguin / Shunn Yayıncı Taslağı',
    description: 'Yayınevlerine ve editörlere sunum için standart çift satır aralıklı klasik taslak formatı.',
    format: 'pdf',
    fontFamily: 'Times New Roman, serif',
    fontSizePt: 12,
    lineSpacing: 2.0,
    pageSize: 'a4',
    orientation: 'portrait',
    marginsMm: { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },
    firstLineIndentMm: 12.7,
    includeTOC: false,
    includeTitlePage: true,
    chapterBreak: 'page',
    isBuiltIn: true,
  },
  {
    id: 'competition-double-spaced',
    name: 'Yarışma Formatı (Çift Satır Aralıklı)',
    description: 'Edebiyat ve öykü yarışmaları jüri okuma standardı. Times New Roman 12pt, 2 satır aralığı.',
    format: 'pdf',
    fontFamily: 'Times New Roman, serif',
    fontSizePt: 12,
    lineSpacing: 2.0,
    pageSize: 'a4',
    orientation: 'portrait',
    marginsMm: { top: 25, right: 25, bottom: 25, left: 25 },
    firstLineIndentMm: 10,
    includeTOC: false,
    includeTitlePage: true,
    chapterBreak: 'separator',
    isBuiltIn: true,
  },
  {
    id: 'academic-thesis-standard',
    name: 'Akademik Tez & Rapor Standardı',
    description: 'Üniversite ve enstitü tez yazım kılavuzlarına uygun sol cilt payı geniş format.',
    format: 'pdf',
    fontFamily: 'Times New Roman, serif',
    fontSizePt: 12,
    lineSpacing: 1.5,
    pageSize: 'a4',
    orientation: 'portrait',
    marginsMm: { top: 25, right: 25, bottom: 25, left: 35 },
    firstLineIndentMm: 10,
    includeTOC: true,
    includeTitlePage: true,
    chapterBreak: 'page',
    isBuiltIn: true,
  },
  {
    id: 'modern-ebook-epub',
    name: 'Modern E-Kitap (EPUB Reflowable)',
    description: 'Tüm e-kitap okuyucular (Kindle, Kobo, Apple Books) için optimize edilmiş dinamik akışlı e-kitap.',
    format: 'epub',
    fontFamily: 'Georgia, serif',
    fontSizePt: 12,
    lineSpacing: 1.35,
    pageSize: 'a5',
    orientation: 'portrait',
    marginsMm: { top: 15, right: 15, bottom: 15, left: 15 },
    firstLineIndentMm: 6,
    includeTOC: true,
    includeTitlePage: true,
    chapterBreak: 'page',
    isBuiltIn: true,
  },
];

const STORAGE_KEY = 'openscriv_compile_presets';

export class CompilePresetsStore {
  private userPresets: CompilePreset[] = [];
  private listeners = new Set<() => void>();

  constructor() {
    this.userPresets = this.loadUserPresets();
  }

  private loadUserPresets(): CompilePreset[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return [];
  }

  private saveUserPresets(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.userPresets));
      }
    } catch {
      // Ignore
    }
    this.notify();
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getPresets(): CompilePreset[] {
    return [...BUILTIN_PRESETS, ...this.userPresets];
  }

  public getPreset(id: string): CompilePreset | undefined {
    return this.getPresets().find((p) => p.id === id);
  }

  public createPreset(data: Omit<CompilePreset, 'id' | 'isBuiltIn'>): CompilePreset {
    const id = `preset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newPreset: CompilePreset = {
      ...data,
      id,
      isBuiltIn: false,
    };
    this.userPresets.push(newPreset);
    this.saveUserPresets();
    return newPreset;
  }

  public updatePreset(id: string, partial: Partial<CompilePreset>): CompilePreset {
    const idx = this.userPresets.findIndex((p) => p.id === id);
    if (idx === -1) {
      throw new Error('Yalnızca kullanıcı tarafından oluşturulan profiller düzenlenebilir.');
    }
    this.userPresets[idx] = { ...this.userPresets[idx], ...partial };
    this.saveUserPresets();
    return this.userPresets[idx];
  }

  public deletePreset(id: string): boolean {
    const initial = this.userPresets.length;
    this.userPresets = this.userPresets.filter((p) => p.id !== id);
    const deleted = this.userPresets.length < initial;
    if (deleted) this.saveUserPresets();
    return deleted;
  }

  public exportPresetsJson(): string {
    return JSON.stringify(this.userPresets, null, 2);
  }

  public importPresetsJson(jsonString: string): number {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) throw new Error('Geçersiz profil dizisi');

      let count = 0;
      for (const item of parsed) {
        if (item.name && item.format) {
          const id = `preset_imp_${Date.now()}_${count}`;
          this.userPresets.push({
            ...item,
            id,
            isBuiltIn: false,
          });
          count++;
        }
      }
      if (count > 0) this.saveUserPresets();
      return count;
    } catch (e: any) {
      throw new Error(`Profil içe aktarma başarısız: ${e.message}`);
    }
  }

  public resetUserPresets(): void {
    this.userPresets = [];
    this.saveUserPresets();
  }
}

export const compilePresetsStore = new CompilePresetsStore();
export default compilePresetsStore;
