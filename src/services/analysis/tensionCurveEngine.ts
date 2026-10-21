/**
 * tensionCurveEngine.ts — Faz 61: Duygu Durum ve Gerilim Eğrisi Çizici Motoru
 */

export type StoryArcShape = 'man_in_a_hole' | 'cinderella' | 'icarus' | 'oedipus' | 'custom';

export interface SceneTensionPoint {
  sceneId: string;
  title: string;
  orderIndex: number;
  tensionScore: number; // 1 (sakin) - 10 (zirve gerilim / çatışma)
  pacingScore: number;  // 1 (yavaş/tasviri) - 10 (hızlı/aksiyon)
  sentimentScore: number; // -5 (karanlık/trajedi) to +5 (coşku/zafer)
  keyEvent?: string;
}

export interface CurvePlotCoordinate {
  x: number;
  y: number;
  sceneId: string;
  point: SceneTensionPoint;
}

export class TensionCurveEngine {
  private points: Map<string, SceneTensionPoint> = new Map();

  public setScenePoint(point: SceneTensionPoint): void {
    // Sınırlandırmalar
    const clamped: SceneTensionPoint = {
      ...point,
      tensionScore: Math.max(1, Math.min(10, Math.round(point.tensionScore))),
      pacingScore: Math.max(1, Math.min(10, Math.round(point.pacingScore))),
      sentimentScore: Math.max(-5, Math.min(5, Math.round(point.sentimentScore))),
    };
    this.points.set(point.sceneId, clamped);
  }

  public getPoints(): SceneTensionPoint[] {
    return Array.from(this.points.values()).sort((a, b) => a.orderIndex - b.orderIndex);
  }

  public removeScenePoint(sceneId: string): void {
    this.points.delete(sceneId);
  }

  public clear(): void {
    this.points.clear();
  }

  public calculateAverageTension(): number {
    const pts = this.getPoints();
    if (pts.length === 0) return 0;
    const sum = pts.reduce((acc, p) => acc + p.tensionScore, 0);
    return Math.round((sum / pts.length) * 10) / 10;
  }

  public findClimaxScene(): SceneTensionPoint | null {
    const pts = this.getPoints();
    if (pts.length === 0) return null;
    return pts.reduce((max, p) => (p.tensionScore > max.tensionScore ? p : max), pts[0]);
  }

  public detectArcShape(): StoryArcShape {
    const pts = this.getPoints();
    if (pts.length < 3) return 'custom';

    const first = pts[0].sentimentScore;
    const mid = pts[Math.floor(pts.length / 2)].sentimentScore;
    const last = pts[pts.length - 1].sentimentScore;

    // Man in a hole: Başlangıç iyi, ortada dibe vurma, sonda tekrar yükselme
    if (first >= 0 && mid < 0 && last >= mid) {
      return 'man_in_a_hole';
    }

    // Cinderella: Başlangıç kötü/aşağıda, ortada yükselme, bir düşüş ve sonda zafer
    if (first < 0 && last > first) {
      return 'cinderella';
    }

    // Icarus: Başlangıç yükseliş, sonda çakılma/trajedi
    if (mid > first && last < mid) {
      return 'icarus';
    }

    return 'custom';
  }

  /**
   * Metin analizinden otomatik sahne gerilim tahmini
   */
  public estimateSceneTension(text: string): { tension: number; pacing: number; sentiment: number } {
    if (!text || text.trim().length === 0) {
      return { tension: 3, pacing: 3, sentiment: 0 };
    }

    const lower = text.toLowerCase();
    const words = lower.split(/\s+/).filter(Boolean);
    const sentences = text.split(/[.!?]+/).filter(Boolean);

    // Kısa cümleler temponun hızlı olduğunu gösterir
    const avgLen = sentences.length > 0 ? words.length / sentences.length : 12;
    const pacing = Math.max(1, Math.min(10, Math.round(20 - avgLen)));

    // Çatışma / aksiyon kelimeleri
    const tensionKeywords = ['kaç', 'silah', 'ölüm', 'katil', 'karanlık', 'korku', 'kan', 'koştu', 'ateş', 'patlama', 'tehlike', 'çığlık'];
    let tensionHits = 0;
    for (const kw of tensionKeywords) {
      if (lower.includes(kw)) tensionHits++;
    }
    const tension = Math.max(1, Math.min(10, Math.round(3 + tensionHits * 1.5)));

    // Duygu kelimeleri
    const positiveWords = ['sevgi', 'mutlu', 'umut', 'kurtuldu', 'zafer', 'güzel', 'ışık', 'güldü'];
    const negativeWords = ['acı', 'keder', 'kayıp', 'mahvoldu', 'ağladı', 'felaket', 'çaresiz', 'hüzün'];

    let sentScore = 0;
    for (const pw of positiveWords) if (lower.includes(pw)) sentScore++;
    for (const nw of negativeWords) if (lower.includes(nw)) sentScore--;

    const sentiment = Math.max(-5, Math.min(5, sentScore));

    return { tension, pacing, sentiment };
  }

  public generateSvgPath(
    width: number = 600,
    height: number = 200,
    padding: number = 20
  ): { pathData: string; coordinates: CurvePlotCoordinate[] } {
    const pts = this.getPoints();
    if (pts.length === 0) {
      return { pathData: '', coordinates: [] };
    }

    const plotWidth = width - padding * 2;
    const plotHeight = height - padding * 2;

    const coordinates: CurvePlotCoordinate[] = pts.map((p, idx) => {
      const x = padding + (pts.length === 1 ? plotWidth / 2 : (idx / (pts.length - 1)) * plotWidth);
      // tensionScore 1-10: 10 en tepede (küçük y), 1 en altta (büyük y)
      const y = padding + plotHeight - ((p.tensionScore - 1) / 9) * plotHeight;
      return { x, y, sceneId: p.sceneId, point: p };
    });

    if (coordinates.length === 1) {
      return {
        pathData: `M ${coordinates[0].x} ${coordinates[0].y}`,
        coordinates,
      };
    }

    // Düzgün Bezier eğrisi oluşturma
    let d = `M ${coordinates[0].x} ${coordinates[0].y}`;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const p0 = coordinates[i];
      const p1 = coordinates[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }

    return { pathData: d, coordinates };
  }
}

export const tensionCurveEngine = new TensionCurveEngine();
export default tensionCurveEngine;
