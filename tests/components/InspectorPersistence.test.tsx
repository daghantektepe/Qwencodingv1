import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../../src/App';
import { serializeTreeWithMeta, updateMetadataInTree } from '../../src/state/project.js';

// Faz 0.6: Bilgi panelindeki düzenlemeler belgeye kaydedilir ve belge değişince karışmaz.

const openDoc = async (user: ReturnType<typeof userEvent.setup>, title: string) => {
  const item = screen.getAllByRole('treeitem').find((el) => within(el).queryByText(title));
  await user.click(within(item!).getByText(title));
};
const panel = () => within(screen.getByLabelText('Bilgi paneli', { selector: 'aside' }));

describe('Inspector metadata persistence', () => {
  beforeEach(() => localStorage.clear());

  it('saves status, word target, synopsis, labels and notes and keeps them per document', async () => {
    const user = userEvent.setup();
    render(<App />);

    const synopsis = panel().getByLabelText('Konu özeti');
    await user.clear(synopsis);
    await user.type(synopsis, 'Yeni özet');
    const target = panel().getByLabelText('Kelime hedefi');
    await user.clear(target);
    await user.type(target, '1500');
    await user.click(panel().getByRole('button', { name: 'Revizyon' }));

    await user.click(panel().getByRole('tab', { name: 'Etiketler' }));
    await user.type(panel().getByLabelText('Yeni etiket adı'), 'Kritik');
    await user.click(panel().getByRole('button', { name: 'Ekle' }));
    await user.click(panel().getByLabelText('Mavi etiketini kaldır'));

    await user.click(panel().getByRole('tab', { name: 'Notlar' }));
    await user.type(panel().getByLabelText('Doküman notları'), 'Hatırla');
    await user.click(panel().getByRole('tab', { name: 'Bilgi' })); // blur → kaydet

    // Başka belgede önceki belgenin değerleri görünmez.
    await openDoc(user, 'Bölüm 2: İpucu');
    expect(panel().getByLabelText('Konu özeti')).toHaveValue('İlk gizemli ipucunun bulunması.');
    expect(panel().getByLabelText('Kelime hedefi')).toHaveValue(0);
    expect(panel().getByRole('button', { name: 'Revizyon' })).toHaveAttribute('aria-pressed', 'false');

    await openDoc(user, 'Bölüm 1: Başlangıç');
    expect(panel().getByLabelText('Konu özeti')).toHaveValue('Yeni özet');
    expect(panel().getByLabelText('Kelime hedefi')).toHaveValue(1500);
    expect(panel().getByRole('button', { name: 'Revizyon' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(panel().getByRole('tab', { name: 'Etiketler' }));
    expect(panel().getByText('Kritik')).toBeInTheDocument();
    expect(panel().queryByText('Mavi')).not.toBeInTheDocument();
    await user.click(panel().getByRole('tab', { name: 'Notlar' }));
    expect(panel().getByLabelText('Doküman notları')).toHaveValue('Hatırla');
  });

  it('keeps inspector-only fields when other metadata changes and when serialized', () => {
    const tree = [
      {
        id: 'd1',
        type: 'doc',
        title: 'Bölüm',
        content: '',
        metadata: { status: 'Taslak', wordTarget: 800, notes: 'not', created: '2026-01-01', modified: '2026-02-01' },
      },
    ];
    const next = updateMetadataInTree(tree, 'd1', { synopsis: 'özet' });
    expect(next[0].metadata).toMatchObject({
      synopsis: 'özet',
      wordTarget: 800,
      notes: 'not',
      created: '2026-01-01',
      modified: '2026-02-01',
    });
    expect(serializeTreeWithMeta(next)[0].metadata).toMatchObject({ wordTarget: 800, notes: 'not' });
  });
});
