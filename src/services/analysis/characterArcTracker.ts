/**
 * characterArcTracker.ts — Faz 87: Karakter Yaşam Çizgisi ve Etkinlik İzleyici
 */

export type CharacterArcStage =
  | 'introduction'
  | 'inciting_incident'
  | 'rising_action'
  | 'crisis'
  | 'climax'
  | 'resolution';

export interface CharacterScenePresence {
  sceneId: string;
  sceneTitle: string;
  order: number;
  mentionCount: number;
  dialogueWordCount: number;
  presenceScore: number; // 0 - 100
  arcStage: CharacterArcStage;
}

export interface CharacterPresenceReport {
  characterName: string;
  role: 'protagonist' | 'supporting' | 'minor';
  totalMentions: number;
  totalScenesPresent: number;
  presencePercentage: number;
  scenes: CharacterScenePresence[];
  forgottenWarning?: {
    lastSeenSceneTitle: string;
    missingScenesCount: number;
    warning: string;
  };
}

export interface PresenceMatrixResult {
  characters: CharacterPresenceReport[];
  allScenes: Array<{ id: string; title: string; order: number; totalWords: number }>;
  coOccurrences: Array<{ charA: string; charB: string; sharedScenesCount: number }>;
}

export class CharacterArcTracker {
  /**
   * Sahne sırasına göre anlatı gelişim evresini belirler (Three-Act / Five-Act model)
   */
  public getArcStage(sceneIndex: number, totalScenes: number): CharacterArcStage {
    if (totalScenes <= 1) return 'introduction';
    const progress = sceneIndex / (totalScenes - 1);

    if (progress <= 0.15) return 'introduction';
    if (progress <= 0.3) return 'inciting_incident';
    if (progress <= 0.6) return 'rising_action';
    if (progress <= 0.75) return 'crisis';
    if (progress <= 0.9) return 'climax';
    return 'resolution';
  }

  /**
   * Tüm romanı tarayıp karakter varlık matrisini ve gelişim eğrilerini hesaplar
   */
  public analyzePresence(
    characters: Array<{
      name: string;
      aliases?: string[];
      role?: 'protagonist' | 'supporting' | 'minor';
    }>,
    scenes: Array<{ id: string; title: string; order: number; content: string }>
  ): PresenceMatrixResult {
    const sortedScenes = [...scenes].sort((a, b) => a.order - b.order);
    const totalScenesCount = sortedScenes.length || 1;

    const allScenesMeta = sortedScenes.map((s) => ({
      id: s.id,
      title: s.title,
      order: s.order,
      totalWords: s.content.trim().split(/\s+/).filter(Boolean).length,
    }));

    const characterReports: CharacterPresenceReport[] = [];

    for (const char of characters) {
      const names = [char.name, ...(char.aliases || [])].map((n) => n.toLowerCase());
      const role = char.role || 'supporting';

      let totalMentions = 0;
      let totalScenesPresent = 0;
      const scenePresences: CharacterScenePresence[] = [];

      let consecutiveMissingCount = 0;
      let lastSeenSceneTitle = '';
      let maxMissingStreak = 0;
      let maxMissingLastSeen = '';

      sortedScenes.forEach((scene, sIdx) => {
        const text = scene.content;
        const arcStage = this.getArcStage(sIdx, totalScenesCount);

        // İsim / lakap geçiş sayısı
        let mentions = 0;
        for (const name of names) {
          const regex = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          const m = text.match(regex);
          if (m) mentions += m.length;
        }

        // Diyalog kelime sayısı hesabı (yaklaşık: tırnak içindeki konuşmalar)
        let dialogueWords = 0;
        if (mentions > 0) {
          const quoteMatches = text.match(/["“«][^"”»]+["”»]/g);
          if (quoteMatches) {
            dialogueWords = quoteMatches
              .join(' ')
              .split(/\s+/)
              .filter(Boolean).length;
          }
        }

        const sceneWords = Math.max(1, allScenesMeta[sIdx].totalWords);
        const presenceScore = Math.min(100, Math.round(((mentions * 10 + dialogueWords) / sceneWords) * 100));

        if (mentions > 0) {
          totalScenesPresent++;
          totalMentions += mentions;
          lastSeenSceneTitle = scene.title;
          consecutiveMissingCount = 0;
        } else {
          consecutiveMissingCount++;
          if (consecutiveMissingCount > maxMissingStreak) {
            maxMissingStreak = consecutiveMissingCount;
            maxMissingLastSeen = lastSeenSceneTitle;
          }
        }

        scenePresences.push({
          sceneId: scene.id,
          sceneTitle: scene.title,
          order: scene.order,
          mentionCount: mentions,
          dialogueWordCount: dialogueWords,
          presenceScore,
          arcStage,
        });
      });

      const presencePercentage = Math.round((totalScenesPresent / totalScenesCount) * 100);

      // Ana karakterler için "Unutuldu" Uyarısı (3 veya daha fazla sahne art arda yoksa)
      let forgottenWarning;
      if (role === 'protagonist' && maxMissingStreak >= 3) {
        forgottenWarning = {
          lastSeenSceneTitle: maxMissingLastSeen || 'Giriş',
          missingScenesCount: maxMissingStreak,
          warning: `'${char.name}' başrol karakteri, '${maxMissingLastSeen}' sahnesinden sonra art arda ${maxMissingStreak} sahne boyunca hiç görünmedi.`,
        };
      }

      characterReports.push({
        characterName: char.name,
        role,
        totalMentions,
        totalScenesPresent,
        presencePercentage,
        scenes: scenePresences,
        forgottenWarning,
      });
    }

    // Birlikte görünme (Co-occurrence) hesabı
    const coOccurrences: Array<{ charA: string; charB: string; sharedScenesCount: number }> = [];

    for (let i = 0; i < characterReports.length; i++) {
      for (let j = i + 1; j < characterReports.length; j++) {
        const c1 = characterReports[i];
        const c2 = characterReports[j];

        let sharedCount = 0;
        sortedScenes.forEach((_, idx) => {
          if (c1.scenes[idx].mentionCount > 0 && c2.scenes[idx].mentionCount > 0) {
            sharedCount++;
          }
        });

        if (sharedCount > 0) {
          coOccurrences.push({
            charA: c1.characterName,
            charB: c2.characterName,
            sharedScenesCount: sharedCount,
          });
        }
      }
    }

    return {
      characters: characterReports,
      allScenes: allScenesMeta,
      coOccurrences: coOccurrences.sort((a, b) => b.sharedScenesCount - a.sharedScenesCount),
    };
  }
}

export const characterArcTracker = new CharacterArcTracker();
export default characterArcTracker;
