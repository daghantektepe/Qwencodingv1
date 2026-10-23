import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { multiWindowBridge } from '../../src/services/window/multiWindowBridge';
import { PopoutButton } from '../../src/components/Window/PopoutButton';
const { WindowManager } = require('../../src/electron/windowManager.cjs');

describe('MultiWindowBridge (Faz 81)', () => {
  beforeEach(() => {
    multiWindowBridge.clear();
  });

  it('bağımsız pencere açar ve açık pencereler listesine kaydeder', async () => {
    const popoutId = await multiWindowBridge.openPopout('corkboard', 'Mantar Pano');
    expect(popoutId).toContain('win-corkboard-');

    const openList = multiWindowBridge.getOpenPopouts();
    expect(openList.length).toBe(1);
    expect(openList[0].viewId).toBe('corkboard');
    expect(openList[0].title).toBe('Mantar Pano');
  });

  it('pencereler arası veri senkronizasyonu (syncData & subscribe) çalışır', () => {
    const onSync = vi.fn();
    const unsub = multiWindowBridge.subscribe('document:update', onSync);

    const payload = { docId: 'doc-1', title: 'Yeni Başlık' };
    multiWindowBridge.syncData('document:update', payload);

    expect(onSync).toHaveBeenCalledWith(payload);
    unsub();
  });

  it('popout kapatıldığında listeden temizlenir ve bildirim yayınlanır', async () => {
    const onClosed = vi.fn();
    multiWindowBridge.subscribe('window:closed', onClosed);

    const popoutId = await multiWindowBridge.openPopout('research', 'Araştırma Paneli');
    expect(multiWindowBridge.getOpenPopouts().length).toBe(1);

    multiWindowBridge.closePopout(popoutId);
    expect(multiWindowBridge.getOpenPopouts().length).toBe(0);
    expect(onClosed).toHaveBeenCalledWith({ id: popoutId, viewId: 'research' });
  });

  it('bağlı ekranları (displays) listeler', async () => {
    const displays = await multiWindowBridge.getDisplays();
    expect(displays.length).toBeGreaterThan(0);
    expect(displays[0].isPrimary).toBe(true);
  });
});

describe('WindowManager (Electron Module)', () => {
  it('Electron WindowManager sınıfı başarıyla başlatılır', () => {
    const wm = new WindowManager();
    expect(wm).toBeDefined();

    const result = wm.createPopoutWindow('editor', 'Editör Penceresi');
    expect(result.success).toBe(true);
    expect(wm.getOpenPopouts().length).toBe(1);

    wm.closePopoutWindow(result.id);
    expect(wm.getOpenPopouts().length).toBe(0);
  });
});

describe('PopoutButton Component', () => {
  it('butona tıklandığında popout açar ve durumunu günceller', async () => {
    const onPopoutOpened = vi.fn();

    render(
      <PopoutButton
        viewId="corkboard"
        viewTitle="Mantar Pano"
        onPopoutOpened={onPopoutOpened}
      />
    );

    const btn = screen.getByTestId('popout-button');
    expect(btn.textContent).toContain('Pencereyi Ayır');

    fireEvent.click(btn);

    await waitFor(() => {
      expect(onPopoutOpened).toHaveBeenCalled();
      expect(btn.textContent).toContain('Ayrıldı');
    });
  });
});
