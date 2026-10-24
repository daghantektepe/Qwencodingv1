/**
 * Native Spellchecker & Custom Dictionary Service
 * Phase 115: Yerel İmla Denetimi ve Edebi Sözlük
 */

let electron = {};
try {
  const req = require('electron');
  if (req && typeof req === 'object') {
    electron = req;
  }
} catch {
  electron = {};
}

const { session, ipcMain } = electron;
const fs = require('fs/promises');
const path = require('path');

// Dahili Türkçe ve İngilizce sözlük listesi / fallback
const BUILTIN_VOCAB = new Set([
  'yazarlık', 'stüdyo', 'karakter', 'bölüm', 'paragraf', 'kurgu', 'taslak',
  'sahne', 'manuscript', 'scrivener', 'proje', 'edebi', 'metin', 'cümle',
  'chapter', 'scene', 'character', 'outline', 'corkboard', 'synopsis'
]);

// Basit Levenshtein mesafesi algoritması (öneriler için yerel fallback)
function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

class SpellcheckerManager {
  constructor() {
    this.customWords = new Set();
    this.languages = ['tr-TR', 'en-US'];
  }

  initSessionSpellcheck(targetSession) {
    const ses = targetSession || (session && session.defaultSession);
    if (!ses || typeof ses.setSpellCheckerLanguages !== 'function') return;

    try {
      ses.setSpellCheckerLanguages(this.languages);
    } catch (err) {
      console.warn('[spellchecker] Diller ayarlanamadı:', err.message);
    }
  }

  addCustomWord(word) {
    if (!word || typeof word !== 'string') return false;
    const clean = word.trim().toLowerCase();
    if (!clean) return false;

    this.customWords.add(clean);

    const ses = session && session.defaultSession;
    if (ses && typeof ses.addWordToSpellCheckerDictionary === 'function') {
      try {
        ses.addWordToSpellCheckerDictionary(clean);
      } catch {
        // ignore
      }
    }
    return true;
  }

  getCustomWords() {
    return Array.from(this.customWords);
  }

  checkSpelling(word) {
    if (!word) return true;
    const clean = word.trim().toLowerCase();
    if (this.customWords.has(clean) || BUILTIN_VOCAB.has(clean)) {
      return true;
    }
    // Rakam ve noktalama temizliği
    if (!/^[a-zçğıöşü]+$/i.test(clean)) return true;
    return false;
  }

  getSuggestions(misspelledWord, limit = 5) {
    if (!misspelledWord) return [];
    const target = misspelledWord.trim().toLowerCase();

    const candidates = [...BUILTIN_VOCAB, ...this.customWords];
    const scored = candidates.map(word => ({
      word,
      distance: levenshteinDistance(target, word)
    }));

    return scored
      .filter(s => s.distance <= 3)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)
      .map(s => s.word);
  }
}

const spellcheckerInstance = new SpellcheckerManager();

function registerSpellcheckerHandlers() {
  if (!ipcMain || typeof ipcMain.handle !== 'function') return;

  ipcMain.handle('spellchecker:check-word', (_evt, { word }) => {
    return {
      word,
      isCorrect: spellcheckerInstance.checkSpelling(word),
      suggestions: spellcheckerInstance.getSuggestions(word),
    };
  });

  ipcMain.handle('spellchecker:add-word', (_evt, { word }) => {
    const success = spellcheckerInstance.addCustomWord(word);
    return { success, word, customWords: spellcheckerInstance.getCustomWords() };
  });

  ipcMain.handle('spellchecker:get-custom-words', () => {
    return spellcheckerInstance.getCustomWords();
  });
}

module.exports = {
  SpellcheckerManager,
  spellcheckerInstance,
  levenshteinDistance,
  registerSpellcheckerHandlers,
};
