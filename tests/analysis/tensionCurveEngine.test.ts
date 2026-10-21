import { describe, it, expect, beforeEach } from 'vitest';
import { TensionCurveEngine } from '../../src/services/analysis/tensionCurveEngine';

describe('Phase 61: Story Emotional Arc & Narrative Tension Curve (tensionCurveEngine)', () => {
  let engine: TensionCurveEngine;

  beforeEach(() => {
    engine = new TensionCurveEngine();
  });

  it('manages scene tension points and clamps scores within valid ranges', () => {
    engine.setScenePoint({
      sceneId: 'sc-1',
      title: 'Açılış',
      orderIndex: 0,
      tensionScore: 15, // > 10 olmamalı
      pacingScore: -2,  // < 1 olmamalı
      sentimentScore: 8 // > 5 olmamalı
    });

    const pts = engine.getPoints();
    expect(pts).toHaveLength(1);
    expect(pts[0].tensionScore).toBe(10);
    expect(pts[0].pacingScore).toBe(1);
    expect(pts[0].sentimentScore).toBe(5);
  });

  it('calculates average tension and identifies climax scene', () => {
    engine.setScenePoint({ sceneId: 's1', title: 'Giriş', orderIndex: 0, tensionScore: 3, pacingScore: 3, sentimentScore: 0 });
    engine.setScenePoint({ sceneId: 's2', title: 'Çatışma', orderIndex: 1, tensionScore: 6, pacingScore: 6, sentimentScore: -2 });
    engine.setScenePoint({ sceneId: 's3', title: 'Büyük Düello', orderIndex: 2, tensionScore: 9, pacingScore: 9, sentimentScore: 4 });

    expect(engine.calculateAverageTension()).toBe(6);

    const climax = engine.findClimaxScene();
    expect(climax).not.toBeNull();
    expect(climax?.sceneId).toBe('s3');
    expect(climax?.tensionScore).toBe(9);
  });

  it('detects story arc shapes correctly', () => {
    // Man in a hole: Başlangıç 2, Ortası -4, Sonu 3
    engine.setScenePoint({ sceneId: 's1', title: 'Giriş', orderIndex: 0, tensionScore: 3, pacingScore: 3, sentimentScore: 2 });
    engine.setScenePoint({ sceneId: 's2', title: 'Kuyuya Düşüş', orderIndex: 1, tensionScore: 8, pacingScore: 7, sentimentScore: -4 });
    engine.setScenePoint({ sceneId: 's3', title: 'Kurtuluş', orderIndex: 2, tensionScore: 5, pacingScore: 5, sentimentScore: 3 });

    expect(engine.detectArcShape()).toBe('man_in_a_hole');
  });

  it('estimates scene tension and pacing from raw text', () => {
    const actionText = 'Koştu! Silah patladı ve karanlık sokakta kan gördü. Çığlık attı, kaç!';
    const est = engine.estimateSceneTension(actionText);

    expect(est.tension).toBeGreaterThanOrEqual(6);
    expect(est.pacing).toBeGreaterThanOrEqual(5);
  });

  it('generates svg path data and coordinates for rendering', () => {
    engine.setScenePoint({ sceneId: 's1', title: '1', orderIndex: 0, tensionScore: 2, pacingScore: 2, sentimentScore: 0 });
    engine.setScenePoint({ sceneId: 's2', title: '2', orderIndex: 1, tensionScore: 8, pacingScore: 8, sentimentScore: 0 });

    const { pathData, coordinates } = engine.generateSvgPath(500, 200, 20);
    expect(pathData).toContain('M ');
    expect(pathData).toContain('C ');
    expect(coordinates).toHaveLength(2);
    expect(coordinates[0].x).toBe(20);
    expect(coordinates[1].x).toBe(480);
  });
});
