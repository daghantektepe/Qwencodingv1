/**
 * Native Chromium Vector PDF & Typeset Printing Engine (printToPDF)
 * Phase 111: Yerel Chromium Vektörel PDF ve Matbaa Baskı Motoru (printToPDF)
 */

const { BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs/promises');
const path = require('path');

const BOOK_PAGE_PRESETS = {
  a4: {
    name: 'A4 Standart',
    pageSize: 'A4',
    marginsType: 1, // default
    margins: { top: 0.8, bottom: 0.8, left: 0.8, right: 0.8 }, // inches
  },
  a5: {
    name: 'A5 Edebi Roman',
    pageSize: 'A5',
    marginsType: 1,
    margins: { top: 0.7, bottom: 0.7, left: 0.85, right: 0.65 }, // 0.85" gutter margin
  },
  novel6x9: {
    name: 'Roman 6x9 (Trade Paperback)',
    pageSize: { width: 6.0, height: 9.0 }, // inches
    marginsType: 1,
    margins: { top: 0.75, bottom: 0.75, left: 0.9, right: 0.6 },
  },
  pocket: {
    name: 'Cep Boy (Pocket Book 4.25x7)',
    pageSize: { width: 4.25, height: 7.0 },
    marginsType: 1,
    margins: { top: 0.5, bottom: 0.5, left: 0.65, right: 0.5 },
  },
};

async function renderHtmlToVectorPdf(htmlContent, presetKey = 'novel6x9', options = {}) {
  const preset = BOOK_PAGE_PRESETS[presetKey] || BOOK_PAGE_PRESETS.novel6x9;

  let printWindow = new BrowserWindow({
    show: false,
    width: 800,
    height: 1000,
    webPreferences: {
      sandbox: false,
    },
  });

  try {
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            @page {
              size: ${typeof preset.pageSize === 'string' ? preset.pageSize : `${preset.pageSize.width}in ${preset.pageSize.height}in`};
              margin: ${preset.margins.top}in ${preset.margins.right}in ${preset.margins.bottom}in ${preset.margins.left}in;
            }
            body {
              font-family: 'Georgia', 'Times New Roman', serif;
              font-size: 11pt;
              line-height: 1.6;
              color: #111;
              margin: 0;
            }
            h1 { font-size: 18pt; text-align: center; margin-top: 2in; margin-bottom: 0.5in; page-break-before: always; }
            h1:first-of-type { margin-top: 1in; page-break-before: avoid; }
            p { text-indent: 1.5em; margin: 0 0 0.5em 0; text-align: justify; }
            .chapter-title { text-align: center; font-weight: bold; }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `;

    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fullHtml)}`);

    const pdfBuffer = await printWindow.webContents.printToPDF({
      printBackground: true,
      pageSize: preset.pageSize,
      margins: preset.margins,
      displayHeaderFooter: Boolean(options.displayHeaderFooter),
      headerTemplate: options.headerTemplate || '<div style="font-size:8pt;width:100%;text-align:center;color:#666;">OpenScriv Manuscript</div>',
      footerTemplate: options.footerTemplate || '<div style="font-size:8pt;width:100%;text-align:center;color:#666;"><span class="pageNumber"></span></div>',
    });

    return { ok: true, buffer: pdfBuffer };
  } finally {
    if (printWindow && !printWindow.isDestroyed()) {
      printWindow.destroy();
      printWindow = null;
    }
  }
}

function registerPdfIpcHandlers() {
  ipcMain.handle('pdf:get-presets', () => {
    return { ok: true, presets: BOOK_PAGE_PRESETS };
  });

  ipcMain.handle('pdf:print-vector', async (_evt, { htmlContent, presetKey, targetPath, options }) => {
    try {
      let finalPath = targetPath;
      if (!finalPath) {
        const result = await dialog.showSaveDialog({
          title: 'Matbaa Vektörel PDF Kaydet',
          defaultPath: 'Kitap_Baski.pdf',
          filters: [{ name: 'PDF Dosyası', extensions: ['pdf'] }],
        });
        if (result.canceled || !result.filePath) {
          return { ok: false, canceled: true };
        }
        finalPath = result.filePath;
      }

      const res = await renderHtmlToVectorPdf(htmlContent, presetKey, options);
      if (!res.ok) throw new Error('PDF derleme hatası');

      await fs.writeFile(finalPath, res.buffer);
      return { ok: true, path: finalPath, sizeBytes: res.buffer.length };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });
}

module.exports = {
  BOOK_PAGE_PRESETS,
  renderHtmlToVectorPdf,
  registerPdfIpcHandlers,
};
