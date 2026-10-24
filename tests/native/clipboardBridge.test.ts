import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClipboardBridge, cleanExternalHtmlText } from '../../src/services/native/clipboardBridge';
const { cleanExternalHtml } = require('../../electron/clipboardIpc.cjs');

describe('Phase 114: Native Clipboard & Rich Media Bridge', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete (window as any).electronBridge;
  });

  it('Microsoft Word artıklarını, mso stillerini ve özel tagleri temizler', () => {
    const dirtyHtml = `
      <!--[if gte mso 9]><xml><w:WordDocument></w:WordDocument></xml><![endif]-->
      <style> p.MsoNormal { mso-style-name:Normal; } </style>
      <p class="MsoNormal" style="mso-margin-top-alt:auto;">
        Bu bir <span style="mso-spacerun:yes">test</span> metnidir.<o:p></o:p>
      </p>
    `;

    const cleaned1 = cleanExternalHtml(dirtyHtml);
    expect(cleaned1).not.toContain('<!--');
    expect(cleaned1).not.toContain('<style>');
    expect(cleaned1).not.toContain('MsoNormal');
    expect(cleaned1).not.toContain('<o:p>');
    expect(cleaned1).toContain('Bu bir');

    const cleaned2 = cleanExternalHtmlText(dirtyHtml);
    expect(cleaned2).not.toContain('<!--');
    expect(cleaned2).not.toContain('<style>');
  });

  it('Web ortamında clipboard readText fallback çalışır', async () => {
    const mockReadText = vi.fn().mockResolvedValue('Panodan gelen düz metin');
    Object.defineProperty(navigator, 'clipboard', {
      value: { readText: mockReadText, writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });

    const res = await ClipboardBridge.readRichClipboard();
    expect(res.type).toBe('text');
    expect(res.content).toBe('Panodan gelen düz metin');
  });

  it('Electron ortamında clipboard:read-rich IPC handler çağrılır', async () => {
    const mockInvoke = vi.fn().mockResolvedValue({
      type: 'image',
      assetPath: 'assets/img_123.png',
      fileName: 'img_123.png',
    });

    (window as any).electronBridge = {
      isDesktop: true,
      invoke: mockInvoke,
    };

    const res = await ClipboardBridge.readRichClipboard('/sample/project.opscriv');
    expect(mockInvoke).toHaveBeenCalledWith('clipboard:read-rich', {
      packagePath: '/sample/project.opscriv',
    });
    expect(res.type).toBe('image');
    expect(res.fileName).toBe('img_123.png');
  });

  it('Pano kopyalama işlemi navigator.clipboard.writeText ile çalışır', async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });

    const success = await ClipboardBridge.copyText('Kopyalanan metin');
    expect(success).toBe(true);
    expect(mockWriteText).toHaveBeenCalledWith('Kopyalanan metin');
  });
});
