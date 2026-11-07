import { afterAll, describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'openscriv-snap-'));
// snapshots.js yalnızca app.getPath('userData') kullanır.
require.cache[require.resolve('electron')] = {
  exports: { app: { getPath: () => userData } },
} as any;
const { createSnapshot, loadSnapshot, listSnapshots } = require('../../electron/snapshots.js');

describe('electron snapshots store', () => {
  afterAll(() => fs.rmSync(userData, { recursive: true, force: true }));

  it('stores contentHtml with the snapshot and returns it on load, not in the list', async () => {
    const html = '<h2>Başlık</h2><p><strong>Kalın</strong></p>';
    const created = await createSnapshot({ projectId: 'p', docId: 'd1', content: 'Başlık\nKalın', contentHtml: html });
    expect(created.ok).toBe(true);
    expect(created.snapshot).not.toHaveProperty('contentHtml');
    expect(created.snapshot).not.toHaveProperty('content');

    const loaded = await loadSnapshot({ projectId: 'p', docId: 'd1', timestamp: created.snapshot.timestamp });
    expect(loaded.snapshot).toMatchObject({ content: 'Başlık\nKalın', contentHtml: html });

    const listed = await listSnapshots({ projectId: 'p', docId: 'd1' });
    expect(listed.snapshots[0]).not.toHaveProperty('contentHtml');
  });

  it('keeps plain-only snapshots loadable without html', async () => {
    const created = await createSnapshot({ projectId: 'p', docId: 'd2', content: 'düz' });
    const loaded = await loadSnapshot({ projectId: 'p', docId: 'd2', timestamp: created.snapshot.timestamp });
    expect(loaded.snapshot.content).toBe('düz');
    expect(loaded.snapshot).not.toHaveProperty('contentHtml');
  });
});
