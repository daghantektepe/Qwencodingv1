// Screenplay & Fountain Format Type Definitions

export type ScreenplayElementType =
  | 'title_page'
  | 'scene_heading'
  | 'action'
  | 'character'
  | 'parenthetical'
  | 'dialogue'
  | 'transition'
  | 'lyric'
  | 'note'
  | 'section'
  | 'synopsis'
  | 'page_break'
  | 'emphasis';

export type EmphasisType = 'italic' | 'bold' | 'bold_italic' | 'underline';

export interface TitlePage {
  title: string;
  author?: string;
  source?: string;
  draftDate?: string;
  contact?: string;
  copyright?: string;
}

export interface ScreenplayElement {
  type: ScreenplayElementType;
  text: string;
  lineNumber?: number;
  // Additional properties based on type
  sceneNumber?: string;
  characterName?: string;
  emphasis?: EmphasisType;
  sectionLevel?: number;
}

export interface ScreenplayDocument {
  titlePage?: TitlePage;
  elements: ScreenplayElement[];
  metadata?: {
    version: string;
    lastModified: string;
    wordCount: number;
    pageCount?: number;
  };
}

export interface FountainParseOptions {
  preserveEmptyLines?: boolean;
  strictMode?: boolean;
}

export interface FountainExportOptions {
  includeTitlePage?: boolean;
  includeMetadata?: boolean;
  lineEnding?: 'lf' | 'crlf';
}

export interface ScreenplayState {
  document: ScreenplayDocument;
  currentElementIndex: number;
  isModified: boolean;
  viewMode: 'edit' | 'preview' | 'split';
  zoomLevel: number;
}

export const SCENE_HEADING_PREFIXES = ['INT.', 'EXT.', 'INT./EXT.', 'EXT./INT.', 'I/E'];
export const TRANSITION_KEYWORDS = ['FADE IN:', 'FADE OUT.', 'CUT TO:', 'DISSOLVE TO:', 'SMASH CUT TO:'];
