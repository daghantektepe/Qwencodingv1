import * as React from 'react';

export interface ScratchpadNote {
  id: string;
  text: string;
  color?: string;
  updated?: string;
}

export interface ScratchpadProps {
  open: boolean;
  onClose: () => void;
  notes?: ScratchpadNote[] | any[];
  onChangeNotes?: (notes: any[]) => void;
  activeDocId?: string | null;
  activeDocTitle?: string | null;
  onSendToDraft?: (noteId: string, text: string) => void;
}

declare const Scratchpad: React.FC<ScratchpadProps>;
export default Scratchpad;
