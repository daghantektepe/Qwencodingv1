import { describe, it, expect, beforeEach, vi } from 'vitest';
import templateManager from '../../src/services/templateManager';
import { getCodexStore, resetCodexStore } from '../../src/services/codexStore';
import { getTimelineStore, resetTimelineStore } from '../../src/services/timelineStore';
import annotationStore from '../../src/services/annotationStore';
import { calculateReadabilityMetrics } from '../../src/utils/readability';
import { getSmartCollectionsStore, resetSmartCollectionsStore } from '../../src/services/smartCollectionsStore';
import cryptoVault from '../../src/services/security/cryptoVault';
import pluginHost from '../../src/services/plugins/pluginHost';
import { WordGoalReminderPlugin } from '../../src/plugins/sample-plugins/WordGoalReminderPlugin';
import { compileDocuments } from '../../src/services/compile/CompileEngine';
import OPEN_SCRIV_VERSION from '../../src/version';

describe('Phase 50: Production v1.0 Full Workflow E2E Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cryptoVault.resetVault();
    pluginHost.reset();
    resetCodexStore();
    resetTimelineStore();
  });

  it('executes a complete end-to-end authoring workflow across all OpenScriv subsystems', async () => {
    // 1. Version info confirmation
    expect(OPEN_SCRIV_VERSION.version).toBe('1.0.0-rc1');
    expect(OPEN_SCRIV_VERSION.phase).toBe(50);

    // 2. Project creation from Novel template
    const novelTemplate = templateManager.getTemplateById('preset-novel-three-act');
    expect(novelTemplate).toBeDefined();
    expect(novelTemplate?.rootNodes.length).toBeGreaterThan(0);

    // 3. Codex Character creation
    const codex = getCodexStore();
    codex.dispatch({
      type: 'ADD_CHARACTER',
      payload: {
        name: 'Evelyn Gray',
        role: 'protagonist',
        description: 'A determined archivist uncovering ancient mysteries.',
        tags: ['scholar', 'lead'],
      },
    });
    const codexState = codex.getState();
    expect(codexState.characters.length).toBe(1);
    expect(codexState.characters[0].name).toBe('Evelyn Gray');

    // 4. Timeline Event creation
    const timeline = getTimelineStore();
    timeline.dispatch({
      type: 'ADD_EVENT',
      payload: {
        title: 'The Great Discovery',
        date: '1924-04-12',
        description: 'Evelyn uncovers the hidden vault beneath the cathedral.',
        characterIds: [],
        laneId: 'main-arc',
      },
    });
    const timelineState = timeline.getState();
    expect(timelineState.events.length).toBe(1);
    expect(timelineState.events[0].title).toBe('The Great Discovery');

    // 5. Document Writing & Readability Analysis
    const sampleText =
      'The morning mist hung heavy over the ancient stones of the ruined abbey. ' +
      'Evelyn Gray gripped the leather-bound journal with trembling fingers, her heart racing against the cold silence. ' +
      'Every clue she had chased for five relentless years pointed directly to this forgotten threshold.';
    const metrics = calculateReadabilityMetrics(sampleText);
    expect(metrics.totalWords).toBeGreaterThan(25);
    expect(metrics.fleschKincaid).toBeDefined();

    // 6. Annotations & Comments
    annotationStore.clearAll();
    const comment = annotationStore.addComment({
      docId: 'doc-chapter-1',
      author: 'Editor Smith',
      content: 'Great opening atmosphere! Keep the tension high here.',
      selectedText: 'ancient stones of the ruined abbey',
      fromPos: 0,
      toPos: 35,
    });
    expect(comment.id).toBeDefined();
    expect(annotationStore.getComments('doc-chapter-1').length).toBe(1);

    // 7. Smart Collections Dynamic Filter
    const collectionsStore = getSmartCollectionsStore();
    collectionsStore.dispatch({
      type: 'UPDATE_DOCUMENTS',
      payload: [
        {
          id: 'doc-1',
          title: 'Chapter 1: The Threshold',
          content: sampleText,
          wordCount: 35,
          status: 'Draft',
          created: '2026-01-01',
          lastModified: '2026-01-02',
          tags: [],
          type: 'chapter',
        },
        {
          id: 'doc-2',
          title: 'Notes: Map of Valley',
          content: 'Rough sketches',
          wordCount: 5,
          status: 'Research',
          created: '2026-01-01',
          lastModified: '2026-01-02',
          tags: [],
          type: 'notes',
        },
      ],
    });
    collectionsStore.dispatch({
      type: 'ADD_COLLECTION',
      payload: {
        name: 'High Wordcount Docs',
        filterGroup: {
          operator: 'AND',
          rules: [{ field: 'wordCount', operator: 'greater_than', value: 20 }],
        },
      },
    });
    const colId = collectionsStore.getState().collections[0].id;
    const filtered = collectionsStore.getCollectionDocuments(colId);
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('doc-1');

    // 8. Plugin System & Milestone Notification
    const notifications: string[] = [];
    pluginHost.setProviders({
      notify: (msg) => notifications.push(msg),
    });
    const goalPlugin = new WordGoalReminderPlugin();
    await pluginHost.registerPlugin(goalPlugin, true);
    goalPlugin.setGoal(30);

    pluginHost.emitWordCountChange(35); // 100% milestone reached
    expect(notifications.some((n) => n.includes('Tebrikler'))).toBe(true);

    // 9. Crypto Vault Zero-Knowledge Encryption Roundtrip
    const plainManuscript = `${sampleText}\n\n[End of Chapter 1]`;
    const vaultPassword = 'ZeroKnowledgeMasterKey2026';

    const envelope = await cryptoVault.encryptProjectData(plainManuscript, vaultPassword);
    expect(envelope.algorithm).toBe('AES-GCM-256');

    const decrypted = await cryptoVault.decryptProjectData(envelope, vaultPassword);
    expect(decrypted).toBe(plainManuscript);

    // 10. Compile Engine Output Generation
    const compileResult = await compileDocuments(
      {
        documents: [
          {
            docId: 'doc-1',
            title: 'Bölüm 1: Eşik',
            content: sampleText,
            level: 1,
          },
        ],
        format: 'txt',
        title: 'Kayıp Arşiv Romanı',
        author: 'Evelyn Gray',
        includeTitlePage: true,
      },
      () => {}
    );

    expect(compileResult.success).toBe(true);
    expect(compileResult.format).toBe('txt');
    expect(compileResult.filename).toContain('.txt');
    expect(compileResult.blob).toBeDefined();
  });
});
