/**
 * CommandPalette.d.ts — Faz 25/26 (p26-s4 önleyici düzeltme).
 *
 * Aynı `never[]` daralma sınıfının komut paletinde tekrarlanmaması için
 * CommandPalette.jsx bileşeninin props bildirimi açıkça sabitlenir.
 * commands dizisi App.tsx'te Command[] tipiyle üretilir; burada eşleşen bir
 * yapısal tip tanımlanır (uyumluluk yapısal tip sistemle sağlanır).
 */

import * as React from 'react';

export interface PaletteCommand {
  id: string;
  title: string;
  hint?: string;
  group?: string;
  shortcut?: string;
  run: () => void | Promise<void>;
}

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands?: PaletteCommand[];
}

declare const CommandPalette: React.FC<CommandPaletteProps>;

export default CommandPalette;
