export interface LegacyWordTargetState {
  /** Eski format: wordTarget */
  wordTarget?: number;
  /** İsteğe bağlı: hedefin birimi (kelime, cümle vb.) */
  unit?: 'words' | 'sentences' | 'paragraphs';
  /** İsteğe bağlı: hedefin aktif olup olmadığı */
  isActive?: boolean;
}

export interface NormalizedWordTarget {
  /** Standartlaştırılmış alan adı: targetWords */
  targetWords: number;
  /** Birim */
  unit: 'words' | 'sentences' | 'paragraphs';
  /** Aktiflik durumu */
  isActive: boolean;
  /** Kaynak alan adı (debug için) */
  sourceField: 'wordTarget' | 'targetWords' | 'none';
}

export function normalizeWordTarget(
  state: Partial<LegacyWordTargetState> & Partial<NormalizedWordTarget>
): NormalizedWordTarget {
  let targetWords = 0;
  let sourceField: NormalizedWordTarget['sourceField'] = 'none';

  if (typeof state.targetWords === 'number' && !isNaN(state.targetWords)) {
    targetWords = state.targetWords;
    sourceField = 'targetWords';
  } else if (typeof state.wordTarget === 'number' && !isNaN(state.wordTarget)) {
    targetWords = state.wordTarget;
    sourceField = 'wordTarget';
  }

  const unit = state.unit || 'words';
  const isActive = state.isActive !== undefined ? state.isActive : true;

  return {
    targetWords,
    unit,
    isActive,
    sourceField,
  };
}

/**
 * Converts a normalized word‑target object back to the legacy storage format.
 * The legacy format no longer contains the `wordTarget` field; it only keeps
 * `unit` and `isActive`. The `targetWords` value is intentionally omitted
 * because the legacy format expects the old `wordTarget` field, which has been
 * removed in the new specification.
 */
export function toLegacyFormat(normalized: NormalizedWordTarget): LegacyWordTargetState {
  const { unit, isActive } = normalized;
  return {
    unit,
    isActive,
  };
}

export function parseWordTargetFromStorage(raw: string | null): LegacyWordTargetState | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<LegacyWordTargetState> &
      Partial<NormalizedWordTarget>;

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const state: LegacyWordTargetState = {
      wordTarget: parsed.wordTarget ?? parsed.targetWords,
      unit: parsed.unit as LegacyWordTargetState['unit'],
      isActive: parsed.isActive,
    };

    // Normalizasyon ile doğrula
    const normalized = normalizeWordTarget(state);
    if (normalized.sourceField === 'none' && !state.wordTarget) {
      return null;
    }

    return state;
  } catch {
    return null;
  }
}
