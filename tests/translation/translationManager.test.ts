import { describe, it, expect, beforeEach } from 'vitest';
import { TranslationManager } from '../../src/services/translation/translationManager';

describe('Phase 59: Side-by-Side Translation & Localization Studio (translationManager)', () => {
  let manager: TranslationManager;

  beforeEach(() => {
    manager = new TranslationManager();
  });

  it('creates translation session and splits text into paragraphs', () => {
    const raw = 'Paragraf bir burası.\n\nParagraf iki ise burada yer alıyor.\n\nVe son paragraf üç.';
    const session = manager.createSession('doc-101', 'Bölüm 1', raw, 'tr', 'en');

    expect(session.id).toBeDefined();
    expect(session.paragraphs).toHaveLength(3);
    expect(session.paragraphs[0].sourceText).toBe('Paragraf bir burası.');
    expect(session.paragraphs[0].status).toBe('empty');
  });

  it('updates paragraph translation and calculates progress', () => {
    const raw = 'Birinci.\n\nİkinci.';
    const session = manager.createSession('doc-102', 'Test', raw);
    const p1 = session.paragraphs[0];
    const p2 = session.paragraphs[1];

    let prog = manager.getProgress(session.id);
    expect(prog.percentage).toBe(0);

    manager.updateTargetParagraph(session.id, p1.id, 'First.');
    expect(session.paragraphs[0].status).toBe('draft');
    expect(session.paragraphs[0].targetText).toBe('First.');

    prog = manager.getProgress(session.id);
    expect(prog.translatedCount).toBe(1);
    expect(prog.percentage).toBe(50);

    manager.approveParagraph(session.id, p1.id);
    expect(session.paragraphs[0].status).toBe('approved');

    manager.updateTargetParagraph(session.id, p2.id, 'Second.', 'approved');
    prog = manager.getProgress(session.id);
    expect(prog.approvedCount).toBe(2);
    expect(prog.percentage).toBe(100);
  });

  it('manages glossary terms and matches keywords in source text', () => {
    const raw = 'The detective entered the Baker Street apartment.';
    const session = manager.createSession('doc-103', 'Holmes', raw, 'en', 'tr');

    manager.addGlossaryTerm(session.id, 'detective', 'dedektif', 'meslek');
    manager.addGlossaryTerm(session.id, 'Baker Street', 'Baker Sokağı', 'yer adı');

    expect(session.glossary).toHaveLength(2);

    const matches = manager.findGlossaryMatches(session.id, 'The detective was searching Baker Street.');
    expect(matches).toHaveLength(2);
    expect(matches.map((m) => m.targetWord)).toContain('dedektif');
    expect(matches.map((m) => m.targetWord)).toContain('Baker Sokağı');

    manager.removeGlossaryTerm(session.id, session.glossary[0].id);
    expect(session.glossary).toHaveLength(1);
  });

  it('exports target document joined by double newlines', () => {
    const raw = 'Part A.\n\nPart B.';
    const session = manager.createSession('doc-104', 'Multi', raw);

    manager.updateTargetParagraph(session.id, session.paragraphs[0].id, 'Kısım A.');
    manager.updateTargetParagraph(session.id, session.paragraphs[1].id, 'Kısım B.');

    const exported = manager.exportTargetDocument(session.id);
    expect(exported).toBe('Kısım A.\n\nKısım B.');
  });
});
