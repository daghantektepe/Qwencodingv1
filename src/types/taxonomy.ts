/**
 * taxonomy.ts — Faz 72: Gelişmiş Etiket ve Renk Kodlama Taksonomi Tipleri
 */

export type TaxonomyCategory = 'label' | 'status' | 'pov' | 'location' | 'theme';
export type ColorStripStyle = 'left_border' | 'background' | 'icon';

export interface TaxonomyTag {
  id: string;
  name: string;
  category: TaxonomyCategory;
  color: string;
  description?: string;
}

export interface DocumentTaxonomyMapping {
  docId: string;
  tagIds: string[];
  colorStripStyle: ColorStripStyle;
  primaryColor?: string;
}

export interface TaxonomyFilter {
  category?: TaxonomyCategory | 'all';
  tagIds?: string[];
  searchQuery?: string;
}
