/**
 * dialogueAnalyzer.ts — Faz 60: Karakter Diyalog ve Ses Tonu Analizörü
 */

export type DialogueTone = 'angry' | 'joyful' | 'formal' | 'sarcastic' | 'neutral';

export interface DialogueLine {
  characterName: string;
  text: string;
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  tone: DialogueTone;
}

export interface CharacterDialogueMetrics {
  characterName: string;
  totalLines: number;
  totalWords: number;
  avgWordsPerLine: number;
  avgSentenceLength: number;
  uniqueWordsCount: number;
  lexicalRichness: number;
  dominantTone: DialogueTone;
  topWords: Array<{ word: string; count: number }>;
}

export interface DocumentDialogueAnalysis {
  totalWords: number;
  dialogueWords: number;
  narrativeWords: number;
  dialogueRatio: number;
  characterMetrics: CharacterDialogueMetrics[];
  similarityPairs: Array<{ charA: string; charB: string; similarityScore: number }>;
}

const TONE_KEYWORDS: Record<DialogueTone, string[]> = {
  angry: ['asla', 'yalan', 'kes', 'lanet', 'aptal', 'bağırdı', 'yeter', 'defol', 'nefret', 'kill', 'hate', 'furious'],
  joyful: ['harika', 'güzel', 'mutlu', 'şahane', 'seviyorum', 'kahkaha', 'aşk', 'gülümsedi', 'love', 'happy', 'great', 'laugh'],
  formal: ['efendim', 'sayın', 'müteşekkirim', 'hürmetler', 'elbette', 'mümkünse', 'arz', 'sir', 'madam', 'please', 'certainly', 'indeed'],
  sarcastic: ['tabii', 'kesinlikle', 'bravo', 'harikasın', 'hah', 'şaka', 'pekala', 'surely', 'obviously', 'brilliant', 'whatever'],
  neutral: []
};

export class DialogueAnalyzer {
  public detectTone(text: string): DialogueTone {
    const lower = text.toLowerCase();
    const scores: Record<DialogueTone, number> = {
      angry: 0,
      joyful: 0,
      formal: 0,
      sarcastic: 0,
      neutral: 0
    };

    // Ünlem ve soru işareti ağırlıkları
    if (text.includes('!') && (lower.includes('hayır') || lower.includes('yeter'))) {
      scores.angry += 2;
    }

    for (const [tone, words] of Object.entries(TONE_KEYWORDS) as [DialogueTone, string[]][]) {
      for (const w of words) {
        if (lower.includes(w)) {
          scores[tone] += 1;
        }
      }
    }

    let topTone: DialogueTone = 'neutral';
    let maxScore = 0;

    for (const [tone, score] of Object.entries(scores) as [DialogueTone, number][]) {
      if (score > maxScore) {
        maxScore = score;
        topTone = tone;
      }
    }

    return topTone;
  }

  public extractDialogueLines(text: string, knownCharacters: string[] = []): DialogueLine[] {
    const lines: DialogueLine[] = [];
    if (!text || text.trim().length === 0) return lines;

    // Tırnak işaretleri ("...", “...”, «...») veya tireli diyaloglar
    const quoteRegex = /["“«]([^"”»]+)["”»]/g;
    let match: RegExpExecArray | null;

    // İsim çıkarımı için bilinen karakterler veya bağlam tespiti
    const defaultChars = knownCharacters.length > 0 ? knownCharacters : ['Karakter A', 'Karakter B'];
    let fallbackIdx = 0;

    while ((match = quoteRegex.exec(text)) !== null) {
      const quoteText = match[1].trim();
      if (quoteText.length === 0) continue;

      // Alıntının bulunduğu satırdaki öncesi ve sonrası
      const lastNewline = text.lastIndexOf('\n', match.index);
      const preceding = text.substring(lastNewline === -1 ? 0 : lastNewline, match.index);

      const nextNewline = text.indexOf('\n', match.index + match[0].length);
      const following = text.substring(
        match.index + match[0].length,
        nextNewline === -1 ? text.length : nextNewline
      );

      let detectedChar = '';
      let closestDistance = Infinity;

      for (const charName of defaultChars) {
        // Öncesindeki son geçiş
        const pIdx = preceding.lastIndexOf(charName);
        if (pIdx !== -1) {
          const dist = preceding.length - (pIdx + charName.length);
          if (dist < closestDistance) {
            closestDistance = dist;
            detectedChar = charName;
          }
        }
        // Sonrasındaki ilk geçiş
        const fIdx = following.indexOf(charName);
        if (fIdx !== -1) {
          if (fIdx < closestDistance) {
            closestDistance = fIdx;
            detectedChar = charName;
          }
        }
      }

      if (!detectedChar) {
        detectedChar = defaultChars[fallbackIdx % defaultChars.length];
        fallbackIdx++;
      }

      const words = quoteText.split(/\s+/).filter(Boolean);
      const sentences = quoteText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
      const sentenceCount = Math.max(1, sentences.length);

      lines.push({
        characterName: detectedChar,
        text: quoteText,
        wordCount: words.length,
        sentenceCount,
        avgSentenceLength: Math.round((words.length / sentenceCount) * 10) / 10,
        tone: this.detectTone(quoteText)
      });
    }

    return lines;
  }

  public analyzeDocument(text: string, knownCharacters: string[] = []): DocumentDialogueAnalysis {
    const words = text.split(/\s+/).filter(Boolean);
    const totalWords = words.length;

    const dialogueLines = this.extractDialogueLines(text, knownCharacters);
    const dialogueWords = dialogueLines.reduce((sum, l) => sum + l.wordCount, 0);
    const narrativeWords = Math.max(0, totalWords - dialogueWords);
    const dialogueRatio = totalWords > 0 ? Math.round((dialogueWords / totalWords) * 100) / 100 : 0;

    // Karakter bazlı gruplama
    const charGroups = new Map<string, DialogueLine[]>();
    for (const line of dialogueLines) {
      if (!charGroups.has(line.characterName)) {
        charGroups.set(line.characterName, []);
      }
      charGroups.get(line.characterName)!.push(line);
    }

    const characterMetrics: CharacterDialogueMetrics[] = [];

    for (const [charName, lines] of charGroups.entries()) {
      const charWords: string[] = [];
      const toneCounts: Record<DialogueTone, number> = {
        angry: 0,
        joyful: 0,
        formal: 0,
        sarcastic: 0,
        neutral: 0
      };

      let totalSentences = 0;

      for (const line of lines) {
        const lwords = line.text.toLowerCase().replace(/[^a-z0-9çğıöşü\s]/gi, '').split(/\s+/).filter(Boolean);
        charWords.push(...lwords);
        totalSentences += line.sentenceCount;
        toneCounts[line.tone]++;
      }

      const wordFreq = new Map<string, number>();
      for (const w of charWords) {
        wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
      }

      const uniqueWords = wordFreq.size;
      const totalCharWords = charWords.length;
      const lexicalRichness = totalCharWords > 0 ? Math.round((uniqueWords / totalCharWords) * 100) / 100 : 0;

      const topWords = Array.from(wordFreq.entries())
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      let dominantTone: DialogueTone = 'neutral';
      let maxToneCount = -1;
      for (const [tone, cnt] of Object.entries(toneCounts) as [DialogueTone, number][]) {
        if (cnt > maxToneCount) {
          maxToneCount = cnt;
          dominantTone = tone;
        }
      }

      characterMetrics.push({
        characterName: charName,
        totalLines: lines.length,
        totalWords: totalCharWords,
        avgWordsPerLine: lines.length > 0 ? Math.round((totalCharWords / lines.length) * 10) / 10 : 0,
        avgSentenceLength: totalSentences > 0 ? Math.round((totalCharWords / totalSentences) * 10) / 10 : 0,
        uniqueWordsCount: uniqueWords,
        lexicalRichness,
        dominantTone,
        topWords
      });
    }

    // Karakterler arası konuşma benzerlik matrisi (Jaccard Similarity)
    const similarityPairs: Array<{ charA: string; charB: string; similarityScore: number }> = [];

    for (let i = 0; i < characterMetrics.length; i++) {
      for (let j = i + 1; j < characterMetrics.length; j++) {
        const a = characterMetrics[i];
        const b = characterMetrics[j];
        const setA = new Set(a.topWords.map((w) => w.word));
        const setB = new Set(b.topWords.map((w) => w.word));

        let intersection = 0;
        setA.forEach((w) => {
          if (setB.has(w)) intersection++;
        });
        const union = new Set([...setA, ...setB]).size;
        const score = union > 0 ? Math.round((intersection / union) * 100) / 100 : 0;

        similarityPairs.push({
          charA: a.characterName,
          charB: b.characterName,
          similarityScore: score
        });
      }
    }

    return {
      totalWords,
      dialogueWords,
      narrativeWords,
      dialogueRatio,
      characterMetrics,
      similarityPairs
    };
  }
}

export const dialogueAnalyzer = new DialogueAnalyzer();
export default dialogueAnalyzer;
