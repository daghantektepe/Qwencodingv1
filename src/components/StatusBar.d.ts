import * as React from 'react';

export interface StatusBarProps {
  content?: string;
  wordTarget?: number;
  wordsToday?: number;
  lastSavedAt?: string | null;
  cursor?: { line: number; column: number } | null;
  zoom?: number;
  onZoomChange?: (z: number) => void;
}

declare const StatusBar: React.FC<StatusBarProps>;
export default StatusBar;
