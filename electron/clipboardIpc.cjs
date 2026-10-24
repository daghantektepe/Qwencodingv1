/**
 * Native Clipboard & Rich Media Ingestion Bridge
 * Phase 114: Yerel Pano (Clipboard) ve Zengin Medya Köprüsü
 */

let electron = {};
try {
  const req = require('electron');
  if (req && typeof req === 'object') {
    electron = req;
  }
} catch {
  electron = {};
}

const clipboard = electron.clipboard || {
  readImage: () => ({ isEmpty: () => true, toPNG: () => Buffer.from('') }),
  readHTML: () => '',
  readText: () => '',
};
const ipcMain = electron.ipcMain || { handle: () => {} };
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');

function cleanExternalHtml(rawHtml) {
  if (!rawHtml) return '';
  return rawHtml
    // Microsoft Word özel taglerini ve yorumlarını temizle
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<o:p>[\s\S]*?<\/o:p>/gi, '')
    .replace(/mso-[a-zA-Z-]+:[^;"]+;?/gi, '')
    .replace(/class="Mso[a-zA-Z]+"/gi, '')
    // Gereksiz boş span ve divleri normalize et
    .replace(/<span\s*>(.*?)<\/span>/gi, '$1')
    .trim();
}

async function saveClipboardImageAsset(packagePath) {
  try {
    if (!clipboard || typeof clipboard.readImage !== 'function') {
      return { ok: false, error: 'Clipboard mevcut değil' };
    }

    const image = clipboard.readImage();
    if (!image || image.isEmpty()) {
      return { ok: false, hasImage: false };
    }

    const pngBuffer = image.toPNG();
    const hash = crypto.createHash('sha256').update(pngBuffer).digest('hex').slice(0, 12);
    const fileName = `img_${Date.now()}_${hash}.png`;

    const assetsDir = path.join(packagePath || process.cwd(), 'assets');
    await fs.mkdir(assetsDir, { recursive: true });

    const targetPath = path.join(assetsDir, fileName);
    await fs.writeFile(targetPath, pngBuffer);

    return {
      ok: true,
      hasImage: true,
      fileName,
      relativePath: `assets/${fileName}`,
      absolutePath: targetPath,
      sizeBytes: pngBuffer.length,
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function registerClipboardHandlers() {
  ipcMain.handle('clipboard:read-rich', async (_evt, { packagePath }) => {
    try {
      // 1) Görsel var mı?
      if (clipboard && typeof clipboard.readImage === 'function') {
        const image = clipboard.readImage();
        if (image && !image.isEmpty()) {
          const assetRes = await saveClipboardImageAsset(packagePath);
          if (assetRes.ok) {
            return {
              type: 'image',
              assetPath: assetRes.relativePath,
              fileName: assetRes.fileName,
            };
          }
        }
      }

      // 2) HTML var mı? (Word veya Web kopyalaması)
      const html = clipboard && typeof clipboard.readHTML === 'function' ? clipboard.readHTML() : '';
      if (html && html.trim().length > 0) {
        return {
          type: 'html',
          content: cleanExternalHtml(html),
        };
      }

      // 3) Düz metin
      const text = clipboard && typeof clipboard.readText === 'function' ? clipboard.readText() : '';
      return {
        type: 'text',
        content: text || '',
      };
    } catch (err) {
      return { type: 'text', content: '', error: err.message };
    }
  });

  ipcMain.handle('clipboard:save-image', async (_evt, { packagePath }) => {
    return saveClipboardImageAsset(packagePath);
  });
}

module.exports = {
  cleanExternalHtml,
  saveClipboardImageAsset,
  registerClipboardHandlers,
};
