/**
 * ThemeCustomizer.d.ts — Faz 26 (p26-s4 düzeltmesi).
 *
 * Sorun: ThemeCustomizer.jsx bir JS bileşendi; TS bunu `any` yerine varsayılan
 * prop çıkarımıyla gördüğü için App.tsx'ten gönderilen diziler (`fontChoices`,
 * `themes`, `lineHeightOptions`) JSX tarafında `never[]` olarak daralıyor ve
 * tip çakışması üretiyordu.
 *
 * Çözüm: Bileşene açık bir Props arayüzü tanımlayan yan dosya (.d.ts) eklendi.
 * Vite/tsc artık JSX dosyası yerine bu bildirim dosyasını kullanır; tüm prop
 * tipleri doğru akar, `never[]` çakışması ortadan kalkar.
 */

import * as React from 'react';

export interface ThemeCardData {
  name: string;
  label: string;
  desc: string;
  swatch: [string, string, string] | string[];
}

export interface FontChoiceData {
  id: string;
  label: string;
}

export interface TypographyData {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
}

export interface FontSizeRangeData {
  min: number;
  max: number;
  step: number;
}

export interface ThemeCustomizerProps {
  open: boolean;
  onClose: () => void;
  themeName: string;
  themes?: ThemeCardData[];
  onThemeChange: (name: string) => void;
  typography?: TypographyData;
  fontChoices?: FontChoiceData[];
  lineHeightOptions?: number[];
  fontSizeRange?: FontSizeRangeData;
  onTypographyChange: (patch: Partial<TypographyData>) => void;
}

declare const ThemeCustomizer: React.FC<ThemeCustomizerProps>;

export default ThemeCustomizer;
