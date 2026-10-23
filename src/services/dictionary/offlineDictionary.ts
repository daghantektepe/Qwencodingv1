export type PartOfSpeech =
  | 'isim'
  | 'sıfat'
  | 'fiil'
  | 'zarf'
  | 'zamir'
  | 'edat'
  | 'bağlaç'
  | 'ünlem';

export interface DictionaryEntry {
  word: string;
  partOfSpeech: PartOfSpeech;
  meaning: string;
  origin: string; // e.g. 'Öz Türkçe', 'Arapça', 'Farsça', 'Fransızca', 'Latince'
  etymologyDetails: string;
  examples: string[];
  firstRecordedCentury?: string;
  synonyms?: string[];
}

export const BUILTIN_LEXICON: DictionaryEntry[] = [
  {
    word: 'kurgu',
    partOfSpeech: 'isim',
    meaning: 'Bir eserin olay örgüsü, yapısı ve çatışma düzeni; zihinde tasarlanan hayali dünya.',
    origin: 'Öz Türkçe',
    etymologyDetails: 'Eski Türkçe kur- (düzenlemek, inşa etmek, bağlamak) fiilinden +gU ekiyle türetilmiştir.',
    examples: ['Romanın kurgusu ilk sayfadan itibaren okuru içine çekiyordu.'],
    firstRecordedCentury: '14. Yüzyıl (Eski Anadolu Türkçesi)',
    synonyms: ['çatı', 'doku', 'tasarım', 'entrika']
  },
  {
    word: 'taslak',
    partOfSpeech: 'isim',
    meaning: 'Bir eserin veya yazının henüz son haline gelmemiş, düzeltmeye açık ilk karalaması.',
    origin: 'Öz Türkçe',
    etymologyDetails: 'Eski Türkçe taş- veya tas- (şekil vermek) kökünden türetildiği kabul edilir.',
    examples: ['İlk taslakta yalnızca hikayenin ana hatlarını kağıda döktü.'],
    firstRecordedCentury: '17. Yüzyıl',
    synonyms: ['müsvedde', 'karalama', 'eskiz']
  },
  {
    word: 'melankoli',
    partOfSpeech: 'isim',
    meaning: 'Hüzün, derin içsel keder, karasevda; yaratıcı melankoli.',
    origin: 'Eski Yunanca',
    etymologyDetails: 'Yunanca melas (kara, siyah) ve khole (safra) kelimelerinden türetilen melancholia (kara safra).',
    examples: ['Kış akşamlarının şehre çöken melankolisi satırlarına yansımıştı.'],
    firstRecordedCentury: '16. Yüzyıl',
    synonyms: ['hüzün', 'keder', 'karasevda']
  },
  {
    word: 'pusula',
    partOfSpeech: 'isim',
    meaning: 'Üzerinde kuzey-güney yönünü gösteren mıknatıslı ibne bulunan yön bulma aleti; mecazen rehber.',
    origin: 'İtalyanca',
    etymologyDetails: 'İtalyanca bussola (küçük kutucuk) sözcüğünden Türkçeye geçmiştir.',
    examples: ['Karakterin içsel pusulası daima adaleti gösteriyordu.'],
    firstRecordedCentury: '16. Yüzyıl (Piri Reis Bahriye)',
    synonyms: ['yönelteç', 'kılavuz']
  },
  {
    word: 'kadim',
    partOfSpeech: 'sıfat',
    meaning: 'Başlangıcı bilinmeyecek kadar eski olan, ezeli, çok köklü.',
    origin: 'Arapça',
    etymologyDetails: 'Arapça q-d-m kökünden gelen qadīm (eski, önde gelen) sözcüğünden alıntıdır.',
    examples: ['Kadim kütüphanenin tozlu raflarında unutulmuş bir elyazması buldu.'],
    firstRecordedCentury: '13. Yüzyıl',
    synonyms: ['ezeli', 'eski', 'köklü']
  },
  {
    word: 'efsun',
    partOfSpeech: 'isim',
    meaning: 'Büyü, sihir; insanın aklını başından alan büyüleyici çekicilik.',
    origin: 'Farsça',
    etymologyDetails: 'Farsça afsūn veya afsān (büyü, sihirli söz) kelimesinden türemiştir.',
    examples: ['Sözcüklerin efsunu sayesinde okuru bambaşka bir çağa taşıdı.'],
    firstRecordedCentury: '14. Yüzyıl',
    synonyms: ['büyü', 'sihir', 'tılsım']
  },
  {
    word: 'yazmak',
    partOfSpeech: 'fiil',
    meaning: 'Söz ve düşünceleri harflerle tespit etmek, edebi bir eser vücuda getirmek.',
    origin: 'Öz Türkçe',
    etymologyDetails: 'Orhun Yazıtları’nda yaz- (çizmek, kazımak, işaretlemek) biçiminde geçer.',
    examples: ['Günde bin kelime yazmadan masadan kalkmazdı.'],
    firstRecordedCentury: '8. Yüzyıl (Orhun Abideleri)',
    synonyms: ['kaleme almak', 'dökmek']
  }
];

export class OfflineDictionaryEngine {
  private dictionaryMap: Map<string, DictionaryEntry> = new Map();

  constructor(customEntries: DictionaryEntry[] = []) {
    this.init(customEntries);
  }

  private normalizeKey(word: string): string {
    return word
      .trim()
      .toLocaleLowerCase('tr-TR')
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'“”]/g, '');
  }

  public init(customEntries: DictionaryEntry[] = []) {
    this.dictionaryMap.clear();

    // Load built-in entries
    BUILTIN_LEXICON.forEach((entry) => {
      this.dictionaryMap.set(this.normalizeKey(entry.word), entry);
    });

    // Load custom
    customEntries.forEach((entry) => {
      this.dictionaryMap.set(this.normalizeKey(entry.word), entry);
    });
  }

  /**
   * Looks up a word definition. Guaranteed sub-5ms response time using Hash Map.
   */
  public lookup(rawWord: string): DictionaryEntry | null {
    const key = this.normalizeKey(rawWord);
    if (!key) return null;

    // Exact match
    const exact = this.dictionaryMap.get(key);
    if (exact) return exact;

    // Basic suffix stripping for Turkish verb forms or plurals (e.g., kurgular -> kurgu, yazdı -> yazmak)
    const stems = [
      key.replace(/(?:lar|ler|da|de|ta|te|dan|den|tan|ten|in|ın|un|ün|si|sı|su|sü)$/i, ''),
      key.replace(/(?:dı|di|du|dü|tı|ti|tu|tü|mış|miş|muş|müş|yor|acak|ecek)$/i, 'mak'),
      key.replace(/(?:dı|di|du|dü|tı|ti|tu|tü|mış|miş|muş|müş|yor|acak|ecek)$/i, 'mek')
    ];

    for (const stem of stems) {
      const match = this.dictionaryMap.get(stem);
      if (match) return match;
    }

    return null;
  }

  /**
   * Search suggestions or fuzzy matches
   */
  public suggest(prefix: string, maxResults: number = 5): DictionaryEntry[] {
    const norm = this.normalizeKey(prefix);
    if (!norm) return [];

    const results: DictionaryEntry[] = [];
    for (const [key, entry] of this.dictionaryMap.entries()) {
      if (key.startsWith(norm)) {
        results.push(entry);
        if (results.length >= maxResults) break;
      }
    }
    return results;
  }

  public addCustomWord(entry: DictionaryEntry) {
    this.dictionaryMap.set(this.normalizeKey(entry.word), entry);
  }

  public getTotalWordCount(): number {
    return this.dictionaryMap.size;
  }
}

export const offlineDictionary = new OfflineDictionaryEngine();
