/**
 * screenplayFormatter.ts — Faz 53: Hollywood Standartlarında Senaryo Biçimlendirici ve Durum Makinesi
 */

import { ScreenplayElementType, ScreenplayElement } from '../../types/screenplay';

export interface NextElementTransition {
  nextType: ScreenplayElementType;
  initialText?: string;
  preventNewline?: boolean;
}

/**
 * Endüstri standardı (Final Draft / Fountain) Tab ve Enter geçiş haritası
 */
export const SCREENPLAY_KEY_TRANSITIONS: Record<
  ScreenplayElementType,
  {
    onEnter: ScreenplayElementType;
    onTab: ScreenplayElementType;
  }
> = {
  scene_heading: { onEnter: 'action', onTab: 'scene_heading' },
  action: { onEnter: 'action', onTab: 'character' },
  character: { onEnter: 'dialogue', onTab: 'parenthetical' },
  parenthetical: { onEnter: 'dialogue', onTab: 'character' },
  dialogue: { onEnter: 'action', onTab: 'parenthetical' },
  transition: { onEnter: 'scene_heading', onTab: 'action' },
  title_page: { onEnter: 'action', onTab: 'action' },
  lyric: { onEnter: 'dialogue', onTab: 'action' },
  note: { onEnter: 'action', onTab: 'action' },
  section: { onEnter: 'action', onTab: 'action' },
  synopsis: { onEnter: 'action', onTab: 'action' },
  page_break: { onEnter: 'scene_heading', onTab: 'action' },
  emphasis: { onEnter: 'action', onTab: 'action' },
};

/**
 * Klavyeden Enter basıldığında sıradaki blok türünü hesaplar.
 */
export function getNextElementTypeOnEnter(currentType: ScreenplayElementType, text: string): ScreenplayElementType {
  // Eğer karakter bloğunda bir şey yazılmadan Enter'a basıldıysa aksiyona dön
  if (currentType === 'character' && !text.trim()) {
    return 'action';
  }
  return SCREENPLAY_KEY_TRANSITIONS[currentType]?.onEnter || 'action';
}

/**
 * Klavyeden Tab basıldığında sıradaki blok türünü hesaplar.
 */
export function getNextElementTypeOnTab(currentType: ScreenplayElementType): ScreenplayElementType {
  return SCREENPLAY_KEY_TRANSITIONS[currentType]?.onTab || 'action';
}

/**
 * Sayfa bazında 1 sayfa = 1 dakika Hollywood kuralına göre tahmini süre ve sayfa adedi hesabı
 * Standart bir senaryo sayfasında ~55 satır veya ~250 kelime bulunur.
 */
export function calculateScreenplayDuration(elements: ScreenplayElement[]): {
  estimatedMinutes: number;
  estimatedPages: number;
  sceneCount: number;
  speakingCharactersCount: number;
} {
  let lineCount = 0;
  let sceneCount = 0;
  const characters = new Set<string>();

  elements.forEach((el) => {
    const rawLines = el.text.split('\n').filter((l) => l.trim().length > 0).length || 1;

    switch (el.type) {
      case 'scene_heading':
        lineCount += 2; // Başlık ve boşluk payı
        sceneCount++;
        break;
      case 'character':
        lineCount += 2; // Üst boşluk + karakter adı
        if (el.text.trim()) {
          characters.add(el.text.trim().toUpperCase());
        }
        break;
      case 'parenthetical':
        lineCount += 1;
        break;
      case 'dialogue':
        lineCount += Math.max(1, Math.ceil(el.text.length / 35)); // Dar diyalog marjı (~35 karakter)
        break;
      case 'transition':
        lineCount += 2;
        break;
      default:
        // Action
        lineCount += Math.max(1, Math.ceil(el.text.length / 60)); // Aksiyon marjı (~60 karakter)
    }
  });

  const linesPerPage = 54;
  const estimatedPages = Math.max(1, Math.round((lineCount / linesPerPage) * 10) / 10);
  const estimatedMinutes = Math.round(estimatedPages); // 1 sayfa = ~1 dakika

  return {
    estimatedMinutes,
    estimatedPages,
    sceneCount,
    speakingCharactersCount: characters.size,
  };
}

/**
 * Sahne başlıklarına otomatik sahne numarası (1, 2, 3...) atar.
 */
export function applySceneNumbers(elements: ScreenplayElement[]): ScreenplayElement[] {
  let counter = 1;
  return elements.map((el) => {
    if (el.type === 'scene_heading') {
      return {
        ...el,
        sceneNumber: String(counter++),
      };
    }
    return el;
  });
}

/**
 * Senaryo içindeki tüm konuşan karakterleri tekilleştirip liste olarak döner.
 */
export function extractCharacterList(elements: ScreenplayElement[]): string[] {
  const characters = new Set<string>();
  elements.forEach((el) => {
    if (el.type === 'character' && el.text.trim()) {
      // (O.S.) veya (V.O.) gibi ekleri temizle
      const cleanName = el.text.replace(/\s*\([^)]*\)/g, '').trim().toUpperCase();
      if (cleanName) {
        characters.add(cleanName);
      }
    }
  });
  return Array.from(characters).sort();
}
