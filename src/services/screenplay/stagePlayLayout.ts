/**
 * stagePlayLayout.ts — Faz 54: Tiyatro (Stage Play) ve BBC Radyo Tiyatrosu Düzen ve Analiz Motoru
 */

export type DramaFormat = 'stage-play' | 'bbc-radio';

export interface StagePlayElement {
  type: 'act' | 'scene' | 'character' | 'dialogue' | 'stage_direction' | 'sound_fx';
  text: string;
  speaker?: string;
  actNumber?: number;
  sceneNumber?: number;
}

export interface CharacterDialogueStats {
  character: string;
  lineCount: number;
  wordCount: number;
  scenesPresent: number[];
}

export interface CharacterSceneMatrixData {
  characters: string[];
  scenes: {
    sceneNumber: number;
    title: string;
    charactersPresent: string[];
  }[];
}

/**
 * Tiyatro veya BBC Radyo oyunu metnini yapılandırılmış bloklara ayrıştırır.
 */
export function parseDramaScript(scriptText: string, format: DramaFormat = 'stage-play'): StagePlayElement[] {
  const lines = scriptText.split('\n');
  const elements: StagePlayElement[] = [];

  let currentAct = 1;
  let currentScene = 1;
  let lastSpeaker = '';

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed) continue;

    // 1. Perde / Act (Örn: PERDE 1 veya ACT I)
    const actMatch = trimmed.match(/^(?:PERDE|ACT)\s+([0-9IVXLCDM]+)/i);
    if (actMatch) {
      currentAct = parseInt(actMatch[1], 10) || currentAct + 1;
      elements.push({ type: 'act', text: trimmed, actNumber: currentAct });
      continue;
    }

    // 2. Sahne / Scene (Örn: SAHNE 1 veya SCENE 1)
    const sceneMatch = trimmed.match(/^(?:SAHNE|SCENE)\s+([0-9IVXLCDM]+)/i);
    if (sceneMatch) {
      currentScene = parseInt(sceneMatch[1], 10) || currentScene + 1;
      elements.push({ type: 'scene', text: trimmed, actNumber: currentAct, sceneNumber: currentScene });
      continue;
    }

    // 3. BBC Radyo Ses Efekti (Örn: FX: KAPI ÇALAR veya [SOUND: YAĞMUR])
    if (
      trimmed.startsWith('FX:') ||
      trimmed.startsWith('SOUND:') ||
      (trimmed.startsWith('[') && trimmed.toUpperCase().includes('FX') && trimmed.endsWith(']'))
    ) {
      elements.push({ type: 'sound_fx', text: trimmed });
      continue;
    }

    // 4. Sahne Yönlendirmesi (Parantez içi veya köşeli parantez)
    if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
      elements.push({ type: 'stage_direction', text: trimmed });
      continue;
    }

    // 5. Karakter / Replik (Tümü büyük harf veya İSİM: formatı)
    const speakerMatch = trimmed.match(/^([A-ZÇĞİÖŞÜa-zçğıöşü\s]+)[:.]\s*(.*)$/);
    if (speakerMatch && speakerMatch[1].length < 30) {
      const charName = speakerMatch[1].trim().toUpperCase();
      const dialogueText = speakerMatch[2].trim();

      elements.push({ type: 'character', text: charName });
      lastSpeaker = charName;

      if (dialogueText) {
        elements.push({
          type: 'dialogue',
          text: dialogueText,
          speaker: charName,
          actNumber: currentAct,
          sceneNumber: currentScene,
        });
      }
      continue;
    }

    // Karakter başlığı altındaki diyalog satırı
    if (lastSpeaker && trimmed) {
      elements.push({
        type: 'dialogue',
        text: trimmed,
        speaker: lastSpeaker,
        actNumber: currentAct,
        sceneNumber: currentScene,
      });
    } else {
      elements.push({ type: 'stage_direction', text: trimmed });
    }
  }

  return elements;
}

/**
 * Karakterlerin replik sayısı, kelime sayısı ve sahne varlıklarını hesaplar.
 */
export function analyzeCharacterLines(scriptText: string): CharacterDialogueStats[] {
  const elements = parseDramaScript(scriptText);
  const statsMap = new Map<string, { lineCount: number; wordCount: number; scenes: Set<number> }>();

  elements.forEach((el) => {
    if (el.type === 'dialogue' && el.speaker) {
      const char = el.speaker;
      const words = el.text.split(/\s+/).filter((w) => w.length > 0).length;
      const sceneNum = el.sceneNumber || 1;

      if (!statsMap.has(char)) {
        statsMap.set(char, { lineCount: 0, wordCount: 0, scenes: new Set() });
      }

      const current = statsMap.get(char)!;
      current.lineCount += 1;
      current.wordCount += words;
      current.scenes.add(sceneNum);
    }
  });

  return Array.from(statsMap.entries())
    .map(([character, data]) => ({
      character,
      lineCount: data.lineCount,
      wordCount: data.wordCount,
      scenesPresent: Array.from(data.scenes).sort((a, b) => a - b),
    }))
    .sort((a, b) => b.wordCount - a.wordCount);
}

/**
 * Sahne bazlı karakter varlık çizelgesi (Character-Scene Matrix) üretir.
 */
export function generateCharacterSceneMatrix(scriptText: string): CharacterSceneMatrixData {
  const elements = parseDramaScript(scriptText);
  const charactersSet = new Set<string>();
  const scenesMap = new Map<number, { title: string; characters: Set<string> }>();

  let currentSceneNum = 1;
  let currentSceneTitle = 'Sahne 1';

  elements.forEach((el) => {
    if (el.type === 'scene') {
      currentSceneNum = el.sceneNumber || currentSceneNum + 1;
      currentSceneTitle = el.text;
      if (!scenesMap.has(currentSceneNum)) {
        scenesMap.set(currentSceneNum, { title: currentSceneTitle, characters: new Set() });
      }
    } else if (el.type === 'dialogue' && el.speaker) {
      charactersSet.add(el.speaker);
      if (!scenesMap.has(currentSceneNum)) {
        scenesMap.set(currentSceneNum, { title: `Sahne ${currentSceneNum}`, characters: new Set() });
      }
      scenesMap.get(currentSceneNum)!.characters.add(el.speaker);
    }
  });

  const characters = Array.from(charactersSet).sort();
  const scenes = Array.from(scenesMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([sceneNumber, data]) => ({
      sceneNumber,
      title: data.title,
      charactersPresent: Array.from(data.characters),
    }));

  return {
    characters,
    scenes,
  };
}
