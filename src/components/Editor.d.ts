import React from 'react';

export interface EditorProps {
  doc?: any;
  document?: any;
  onChange?: (docId: string, newContent: string) => void;
  onSaveNow?: (docId: string, content: string) => void;
  onRename?: (docId: string, title: string) => void;
  wordTarget?: number;
  saveState?: string;
  lastSavedAt?: string | null;
  ariaLabel?: string;
  [key: string]: any;
}

declare const Editor: React.FC<EditorProps>;
export default Editor;
