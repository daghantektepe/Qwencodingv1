/**
 * templates.ts — Faz 45: Proje Şablon Motoru ve Yazım Sihirbazı Tipleri
 */

export type TemplateCategory =
  | 'fiction'
  | 'academic'
  | 'scriptwriting'
  | 'poetry'
  | 'general'
  | 'custom';

export interface TemplateFolderNode {
  id: string;
  title: string;
  type: 'folder' | 'document';
  synopsis?: string;
  content?: string;
  children?: TemplateFolderNode[];
  metadata?: {
    status?: 'draft' | 'revised' | 'final';
    label?: string;
    targetWords?: number;
  };
}

export interface ProjectTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  icon: string;
  targetAudience?: string;
  rootNodes: TemplateFolderNode[];
  targets?: {
    totalWords?: number;
    deadline?: string;
  };
  isCustom?: boolean;
  version: string;
}
