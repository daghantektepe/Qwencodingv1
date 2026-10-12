/**
 * EPUB Generator Service
 * Document'leri EPUB formatında dışa aktarır
 */

import JSZip from 'jszip';
import { compileToHTML, markdownToHTML, type CompileOptions, type DocumentNode } from './markdownCompiler';

export interface EPUBOptions extends CompileOptions {
  language?: string;
  publisher?: string;
  description?: string;
  subjects?: string[];
  rights?: string;
}

/**
 * Document'leri EPUB formatında dışa aktarır
 */
export async function exportToEPUB(
  documents: DocumentNode[],
  options: EPUBOptions,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const zip = new JSZip();
  
  onProgress?.(10);

  // mimetype dosyası (sıkıştırılmamış olmalı)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  
  onProgress?.(20);

  // META-INF/container.xml
  zip.file('META-INF/container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

  onProgress?.(30);

  // OEBPS dizini
  const oebps = zip.folder('OEBPS');
  if (!oebps) throw new Error('Failed to create OEBPS folder');

  // Stil dosyası
  oebps.file('style.css', getEPUBCSS());

  onProgress?.(40);

  // Başlık sayfası
  if (options.includeTitlePage) {
    oebps.file('title.xhtml', generateTitlePage(options));
  }

  // İçindekiler sayfası
  if (options.includeTOC) {
    oebps.file('toc.xhtml', generateTOC(documents, options));
  }

  onProgress?.(50);

  // Bölüm dosyaları
  const chapters: { id: string; filename: string; title: string }[] = [];
  
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    const filename = `chapter${i + 1}.xhtml`;
    const id = `chapter${i + 1}`;
    
    chapters.push({
      id,
      filename,
      title: doc.title,
    });
    
    const chapterContent = generateChapter(doc, i + 1);
    oebps.file(filename, chapterContent);
    
    const progress = 50 + (i / documents.length) * 30;
    onProgress?.(progress);
  }

  onProgress?.(80);

  // content.opf (package document)
  oebps.file('content.opf', generateOPF(documents, chapters, options));

  // toc.ncx (navigasyon)
  oebps.file('toc.ncx', generateNCX(chapters, options));

  onProgress?.(90);

  // Nav document (EPUB 3)
  oebps.file('nav.xhtml', generateNav(chapters, options));

  onProgress?.(95);

  // ZIP oluştur
  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
  });

  onProgress?.(100);

  return blob;
}

/**
 * Başlık sayfası XHTML
 */
function generateTitlePage(options: EPUBOptions): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${options.language || 'tr'}">
<head>
  <meta charset="UTF-8"/>
  <title>${escapeXML(options.title)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <section class="title-page">
    <h1 class="book-title">${escapeXML(options.title)}</h1>
    ${options.author ? `<p class="book-author">${escapeXML(options.author)}</p>` : ''}
    ${options.publisher ? `<p class="publisher">${escapeXML(options.publisher)}</p>` : ''}
  </section>
</body>
</html>`;
}

/**
 * İçindekiler XHTML
 */
function generateTOC(documents: DocumentNode[], options: EPUBOptions): string {
  const tocItems = documents.map((doc, index) => 
    `<li><a href="chapter${index + 1}.xhtml">${escapeXML(doc.title)}</a></li>`
  ).join('\n      ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${options.language || 'tr'}">
<head>
  <meta charset="UTF-8"/>
  <title>İçindekiler</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>İçindekiler</h1>
    <ol>
      ${tocItems}
    </ol>
  </nav>
</body>
</html>`;
}

/**
 * Bölüm XHTML
 */
function generateChapter(doc: DocumentNode, index: number): string {
  const level = doc.level || 1;
  const headingTag = `h${level + 1}`;
  const htmlContent = markdownToHTML(doc.content);

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="tr">
<head>
  <meta charset="UTF-8"/>
  <title>${escapeXML(doc.title)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <section class="chapter" id="chapter${index}">
    <${headingTag}>${escapeXML(doc.title)}</${headingTag}>
    <div class="chapter-content">
      ${htmlContent}
    </div>
  </section>
</body>
</html>`;
}

/**
 * content.opf (Package Document)
 */
function generateOPF(
  documents: DocumentNode[],
  chapters: { id: string; filename: string; title: string }[],
  options: EPUBOptions
): string {
  const manifestItems: string[] = [
    '<item id="style" href="style.css" media-type="text/css"/>',
    '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>',
    '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
  ];

  const spineItems: string[] = [];

  if (options.includeTitlePage) {
    manifestItems.push('<item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>');
    spineItems.push('<itemref idref="title"/>');
  }

  if (options.includeTOC) {
    manifestItems.push('<item id="toc" href="toc.xhtml" media-type="application/xhtml+xml"/>');
    spineItems.push('<itemref idref="toc"/>');
  }

  chapters.forEach((chapter) => {
    manifestItems.push(`<item id="${chapter.id}" href="${chapter.filename}" media-type="application/xhtml+xml"/>`);
    spineItems.push(`<itemref idref="${chapter.id}"/>`);
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:identifier id="BookId">urn:uuid:${generateUUID()}</dc:identifier>
    <dc:title>${escapeXML(options.title)}</dc:title>
    ${options.author ? `<dc:creator opf:role="aut">${escapeXML(options.author)}</dc:creator>` : ''}
    <dc:language>${options.language || 'tr'}</dc:language>
    <dc:date>${new Date().toISOString().split('T')[0]}</dc:date>
    ${options.publisher ? `<dc:publisher>${escapeXML(options.publisher)}</dc:publisher>` : ''}
    ${options.description ? `<dc:description>${escapeXML(options.description)}</dc:description>` : ''}
    ${options.rights ? `<dc:rights>${escapeXML(options.rights)}</dc:rights>` : ''}
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
    ${manifestItems.join('\n    ')}
  </manifest>
  <spine toc="ncx">
    ${spineItems.join('\n    ')}
  </spine>
</package>`;
}

/**
 * toc.ncx (NCX Navigation)
 */
function generateNCX(
  chapters: { id: string; filename: string; title: string }[],
  options: EPUBOptions
): string {
  const navPoints = chapters.map((chapter, index) => `
    <navPoint id="navPoint-${index + 1}" playOrder="${index + 1}">
      <navLabel><text>${escapeXML(chapter.title)}</text></navLabel>
      <content src="${chapter.filename}"/>
    </navPoint>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:${generateUUID()}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escapeXML(options.title)}</text></docTitle>
  <navMap>
    ${navPoints}
  </navMap>
</ncx>`;
}

/**
 * nav.xhtml (EPUB 3 Navigation)
 */
function generateNav(
  chapters: { id: string; filename: string; title: string }[],
  options: EPUBOptions
): string {
  const navItems = chapters.map((chapter) => 
    `<li><a href="${chapter.filename}">${escapeXML(chapter.title)}</a></li>`
  ).join('\n        ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${options.language || 'tr'}">
<head>
  <meta charset="UTF-8"/>
  <title>Navigation</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>İçindekiler</h1>
    <ol>
        ${navItems}
    </ol>
  </nav>
</body>
</html>`;
}

/**
 * EPUB için CSS
 */
function getEPUBCSS(): string {
  return `
body {
  font-family: serif;
  line-height: 1.6;
  margin: 1em;
  color: #333;
}

.title-page {
  text-align: center;
  padding: 3em 0;
}

.book-title {
  font-size: 2em;
  font-weight: bold;
  margin-bottom: 1em;
}

.book-author {
  font-size: 1.2em;
  font-style: italic;
  color: #666;
}

.publisher {
  font-size: 0.9em;
  color: #999;
  margin-top: 2em;
}

h1, h2, h3 {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: bold;
}

h1 { font-size: 1.8em; }
h2 { font-size: 1.5em; }
h3 { font-size: 1.2em; }

p {
  margin-bottom: 0.8em;
  text-align: justify;
}

.chapter {
  page-break-before: always;
}

.toc ol {
  list-style-type: decimal;
  padding-left: 2em;
}

.toc a {
  text-decoration: none;
  color: #333;
}
`;
}

/**
 * XML'den özel karakterleri temizler
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * UUID oluşturur
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * EPUB dosyasını indirir
 */
export function downloadEPUB(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
