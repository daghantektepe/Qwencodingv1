/**
 * continuityChecker.ts — Faz 84: Kurgu Mantık Denetleyicisi ve Çelişki Avcısı
 */

export interface CharacterProfile {
  name: string;
  aliases?: string[];
  traits?: Record<string, string>; // { eyeColor: 'mavi', hairColor: 'sarı', isAlive: 'true' }
}

export interface DocumentSection {
  docId: string;
  docTitle: string;
  order: number;
  content: string;
}

export interface ContinuityConflict {
  id: string;
  characterName: string;
  traitKey: string;
  severity: 'high' | 'medium' | 'low';
  docA: {
    docId: string;
    docTitle: string;
    snippet: string;
    value: string;
    line?: number;
  };
  docB: {
    docId: string;
    docTitle: string;
    snippet: string;
    value: string;
    line?: number;
  };
  description: string;
  status: 'pending' | 'resolved' | 'ignored';
}

export class ContinuityChecker {
  private conflicts: Map<string, ContinuityConflict> = new Map();

  /**
   * Tüm roman bölümlerini ve karakterleri tarayıp çelişkileri çıkarır
   */
  public analyzeProject(
    characters: CharacterProfile[],
    documents: DocumentSection[]
  ): ContinuityConflict[] {
    const sortedDocs = [...documents].sort((a, b) => a.order - b.order);
    const results: ContinuityConflict[] = [];

    for (const char of characters) {
      const charNames = [char.name, ...(char.aliases || [])].map((n) => n.toLowerCase());

      // Karakterin her belgede tespit edilen özellikleri
      // Trait -> Array of occurrences: { docId, docTitle, value, snippet, line }
      const eyeColorOccurrences: Array<{
        docId: string;
        docTitle: string;
        value: string;
        snippet: string;
        line: number;
      }> = [];

      const hairColorOccurrences: Array<{
        docId: string;
        docTitle: string;
        value: string;
        snippet: string;
        line: number;
      }> = [];

      const deathOccurrences: Array<{
        docId: string;
        docTitle: string;
        order: number;
        snippet: string;
      }> = [];

      const speechAfterOccurrences: Array<{
        docId: string;
        docTitle: string;
        order: number;
        snippet: string;
      }> = [];

      // Dokümanları sırayla tara
      sortedDocs.forEach((doc) => {
        const lines = doc.content.split('\n');

        lines.forEach((line, lineIdx) => {
          const lowerLine = line.toLowerCase();
          const mentionsChar = charNames.some((n) => lowerLine.includes(n));

          // 1. Göz Rengi Kontrolü
          // Örn: mavi gözlü, yeşil gözleri, ela gözleriyle
          const eyeMatch = line.match(/(mavi|yeşil|ela|kahverengi|kara|gri)\s+göz(lü|leri|leriyle|ler)?/i);
          if (eyeMatch && mentionsChar) {
            const color = eyeMatch[1].toLowerCase();
            eyeColorOccurrences.push({
              docId: doc.docId,
              docTitle: doc.docTitle,
              value: color,
              snippet: line.trim(),
              line: lineIdx + 1,
            });
          }

          // 2. Saç Rengi Kontrolü
          const hairMatch = line.match(/(sarı|kızıl|kumral|siyah|beyaz|kır)\s+saç(lı|ları|larıyla)?/i);
          if (hairMatch && mentionsChar) {
            const color = hairMatch[1].toLowerCase();
            hairColorOccurrences.push({
              docId: doc.docId,
              docTitle: doc.docTitle,
              value: color,
              snippet: line.trim(),
              line: lineIdx + 1,
            });
          }

          // 3. Ölüm / Hayatta Olma Kontrolü
          if (mentionsChar) {
            if (/(öldü|vefat etti|hayatını kaybetti|cansız bedeni)/i.test(line)) {
              deathOccurrences.push({
                docId: doc.docId,
                docTitle: doc.docTitle,
                order: doc.order,
                snippet: line.trim(),
              });
            } else if (/(dedi|fısıldadı|bağırdı|konuştu|cevap verdi)/i.test(line)) {
              speechAfterOccurrences.push({
                docId: doc.docId,
                docTitle: doc.docTitle,
                order: doc.order,
                snippet: line.trim(),
              });
            }
          }
        });
      });

      // Çelişki 1: Göz Rengi Değişimi
      for (let i = 0; i < eyeColorOccurrences.length; i++) {
        for (let j = i + 1; j < eyeColorOccurrences.length; j++) {
          const o1 = eyeColorOccurrences[i];
          const o2 = eyeColorOccurrences[j];
          if (o1.value !== o2.value) {
            const conflictId = `conflict-eye-${char.name}-${o1.docId}-${o2.docId}`;
            results.push({
              id: conflictId,
              characterName: char.name,
              traitKey: 'Göz Rengi',
              severity: 'medium',
              docA: o1,
              docB: o2,
              description: `'${char.name}' karakterinin göz rengi '${o1.docTitle}' içinde '${o1.value}' iken '${o2.docTitle}' içinde '${o2.value}' olarak geçiyor.`,
              status: this.conflicts.get(conflictId)?.status || 'pending',
            });
          }
        }
      }

      // Çelişki 2: Saç Rengi Değişimi
      for (let i = 0; i < hairColorOccurrences.length; i++) {
        for (let j = i + 1; j < hairColorOccurrences.length; j++) {
          const o1 = hairColorOccurrences[i];
          const o2 = hairColorOccurrences[j];
          if (o1.value !== o2.value) {
            const conflictId = `conflict-hair-${char.name}-${o1.docId}-${o2.docId}`;
            results.push({
              id: conflictId,
              characterName: char.name,
              traitKey: 'Saç Rengi',
              severity: 'medium',
              docA: o1,
              docB: o2,
              description: `'${char.name}' karakterinin saç rengi '${o1.docTitle}' içinde '${o1.value}' iken '${o2.docTitle}' içinde '${o2.value}' olarak geçiyor.`,
              status: this.conflicts.get(conflictId)?.status || 'pending',
            });
          }
        }
      }

      // Çelişki 3: Ölen Karakterin Sonraki Bölümlerde Konuşması (High Severity)
      if (deathOccurrences.length > 0) {
        const firstDeath = deathOccurrences[0];
        const speechesAfterDeath = speechAfterOccurrences.filter(
          (s) => s.order > firstDeath.order
        );

        speechesAfterDeath.forEach((speech) => {
          const conflictId = `conflict-death-${char.name}-${firstDeath.docId}-${speech.docId}`;
          results.push({
            id: conflictId,
            characterName: char.name,
            traitKey: 'Hayatta Olma Durumu',
            severity: 'high',
            docA: {
              docId: firstDeath.docId,
              docTitle: firstDeath.docTitle,
              snippet: firstDeath.snippet,
              value: 'Vefat Etti / Ölü',
            },
            docB: {
              docId: speech.docId,
              docTitle: speech.docTitle,
              snippet: speech.snippet,
              value: 'Konuşuyor / Canlı',
            },
            description: `'${char.name}' karakteri '${firstDeath.docTitle}' bölümünde vefat etmiş görünmesine rağmen sonraki '${speech.docTitle}' bölümünde diyalog veya eylem gerçekleştiriyor!`,
            status: this.conflicts.get(conflictId)?.status || 'pending',
          });
        });
      }
    }

    results.forEach((c) => this.conflicts.set(c.id, c));
    return results;
  }

  public setConflictStatus(conflictId: string, status: 'resolved' | 'ignored' | 'pending'): void {
    const existing = this.conflicts.get(conflictId);
    if (existing) {
      existing.status = status;
      this.conflicts.set(conflictId, existing);
    }
  }

  public getConflicts(): ContinuityConflict[] {
    return Array.from(this.conflicts.values());
  }

  public clear(): void {
    this.conflicts.clear();
  }
}

export const continuityChecker = new ContinuityChecker();
export default continuityChecker;
