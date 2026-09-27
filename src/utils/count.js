/**
 * OpenScriv - Faz 9: Kelime sayimi ve hedef yardimcilari
 *
 * Tamamen saf (pure) fonksiyonlar — React'e veya DOM'a bagimli degildir.
 * Unity testleri icin src/utils/__tests__/count.test.jsx ile dogrulanabilir.
 */

/**
 * Bir metin dizgesinden kelime sayisini hesaplar.
 *
 * Kurallar:
 *  - Unicode bosluklar (bosluk, tab, satir sonu, NBSP vb.) ayirici kabul edilir.
 *  - Yalnizca noktalama/ozel karakterden olusan token'lar ("---", "...", "***")
 *    kelime SAYILMAZ; en az bir harf veya rakam icermeyen token'lar elenir.
 *  - Turkce ve diger dillerdeki harfler (Unicode harf ozelligi) harf sayilir.
 *  - Sayilar ("123", "45,6" -> 2 token) kelime olarak sayilir.
 *
 * @param {string} text
 * @returns {number} kelime sayisi
 */
export function countWords(text) {
  if (typeof text !== 'string' || text.trim().length === 0) return 0;

  // Nokta/virgul gibi ayiricilari bosluga cevirip token'lara boluyoruz;
  // ornegin "yazi.hayati" -> "yazi hayati" mantigi yerine klasik davranis:
  // once bosluk bazli bol, sonra her token'in harf/rakam icerdigini dogrula.
  const tokens = text.split(/\s+/);

  let count = 0;
  for (const token of tokens) {
    if (!token) continue;
    // Token en az bir Unicode harf (\p{L}) veya rakam (\p{N}) icermeli.
    if (/[\p{L}\p{N}]/u.test(token)) count += 1;
  }
  return count;
}

/**
 * Karakter sayimi.
 * @param {string} text
 * @param {{ includeSpaces?: boolean }} [opts]
 */
export function countChars(text, opts = {}) {
  const { includeSpaces = true } = opts;
  if (typeof text !== 'string') return 0;
  return includeSpaces ? text.length : text.replace(/\s/g, '').length;
}

/**
 * Cümle sayisi (nokta, soru, ünlem ile biten).
 */
export function countSentences(text) {
  if (typeof text !== 'string' || !text.trim()) return 0;
  const matches = text.match(/[^.!?…]+[.!?…]+(\s|$)|[^.!?…]+$/g);
  return matches ? matches.filter((m) => /[\p{L}\p{N}]/u.test(m)).length : 0;
}

/**
 * Paragraf sayisi (bir veya daha fazla bos satirla ayrilmis bloklar).
 */
export function countParagraphs(text) {
  if (typeof text !== 'string' || !text.trim()) return 0;
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => /[\p{L}\p{N}]/u.test(p)).length;
}

/**
 * Okuma suresi tahmini (dakika, yukari yuvarlanmis).
 * Varsayilan: 200 kelime/dakika.
 */
export function estimateReadingTimeMinutes(text, wordsPerMinute = 200) {
  const words = countWords(text);
  if (words === 0) return 0;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

/**
 * Agactaki TUM dokumanlarin toplam kelime sayisini hesaplar.
 * @param {Node[]} tree
 */
export function countTreeWords(tree) {
  let total = 0;
  const walk = (nodes) => {
    for (const n of nodes || []) {
      if (n.type === 'doc') total += countWords(n.content || '');
      if (n.type === 'folder' && Array.isArray(n.children)) walk(n.children);
    }
  };
  walk(tree);
  return total;
}

/**
 * Ilerleme hesabi: current/target arasindaki oran (0-1 arasi kirpilir).
 * target <= 0 ise null doner (hedef yok).
 */
export function progressRatio(current, target) {
  if (!target || target <= 0) return null;
  const r = current / target;
  return Math.min(1, Math.max(0, r));
}

/**
 * Hedef bazli ozet nesnesi uretir — WordCount bileseni bu nesneyi render eder.
 *
 * @param {Object} args
 * @param {number} args.current       - mevcut kelime sayisi
 * @param {number|null} [args.target] - hedef (null/0 => hedef yok)
 * @returns {{ current:number, target:number|null, ratio:number|null, remaining:number, percent:number|null, reached:boolean }}
 */
export function buildProgress({ current = 0, target = null }) {
  const ratio = progressRatio(current, target);
  return {
    current,
    target,
    ratio,
    percent: ratio == null ? null : Math.round(ratio * 100),
    remaining: target && target > 0 ? Math.max(0, target - current) : null,
    reached: target != null && target > 0 && current >= target,
  };
}
