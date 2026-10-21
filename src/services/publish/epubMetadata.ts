/**
 * epubMetadata.ts — Faz 51: EPUB 3 / MOBI Metadata ve Standart XML Şablon Üreticisi
 */

export interface EpubChapter {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface EpubMetadata {
  title: string;
  author: string;
  language?: string;
  publisher?: string;
  isbn?: string;
  publicationDate?: string;
  description?: string;
  rights?: string;
  coverImageBase64?: string;
}

export function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateContainerXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
}

export function generateEpubCss(): string {
  return `/* OpenScriv EPUB 3 Standard Typography */
@charset "utf-8";

body {
  font-family: Georgia, "Times New Roman", serif;
  line-height: 1.6;
  margin: 5%;
  padding: 0;
  text-align: justify;
  color: #111111;
}

h1, h2, h3 {
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-weight: 600;
  margin-top: 1.5em;
  margin-bottom: 0.8em;
  page-break-before: always;
}

p {
  margin: 0;
  text-indent: 1.5em;
}

p.first-para {
  text-indent: 0;
}

p.first-para::first-letter {
  font-size: 3.2em;
  float: left;
  line-height: 0.8;
  margin-right: 0.12em;
  font-weight: bold;
}

.cover-wrapper {
  text-align: center;
  padding: 0;
  margin: 0;
  height: 100vh;
}

.cover-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
`;
}

export function generatePackageOpf(metadata: EpubMetadata, chapters: EpubChapter[]): string {
  const identifier = metadata.isbn || `urn:uuid:openscriv-${Date.now()}`;
  const lang = metadata.language || 'tr';
  const pubDate = metadata.publicationDate || new Date().toISOString().split('T')[0];

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="pub-id">${escapeXml(identifier)}</dc:identifier>
    <dc:title>${escapeXml(metadata.title)}</dc:title>
    <dc:creator>${escapeXml(metadata.author)}</dc:creator>
    <dc:language>${escapeXml(lang)}</dc:language>
    <dc:date>${escapeXml(pubDate)}</dc:date>
    <dc:publisher>${escapeXml(metadata.publisher || 'OpenScriv Publisher')}</dc:publisher>
    ${metadata.description ? `<dc:description>${escapeXml(metadata.description)}</dc:description>` : ''}
    ${metadata.rights ? `<dc:rights>${escapeXml(metadata.rights)}</dc:rights>` : ''}
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="style" href="style.css" media-type="text/css"/>
    ${chapters
      .map(
        (ch, i) =>
          `<item id="chapter_${i + 1}" href="chapters/chapter_${i + 1}.xhtml" media-type="application/xhtml+xml"/>`
      )
      .join('\n    ')}
  </manifest>
  <spine>
    ${chapters.map((_, i) => `<itemref idref="chapter_${i + 1}"/>`).join('\n    ')}
  </spine>
</package>`;
}

export function generateNavXhtml(metadata: EpubMetadata, chapters: EpubChapter[]): string {
  const lang = metadata.language || 'tr';
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${escapeXml(lang)}">
<head>
  <meta charset="utf-8"/>
  <title>İçindekiler - ${escapeXml(metadata.title)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>İçindekiler</h1>
    <ol>
      ${chapters
        .map(
          (ch, i) =>
            `<li><a href="chapters/chapter_${i + 1}.xhtml">${escapeXml(ch.title)}</a></li>`
        )
        .join('\n      ')}
    </ol>
  </nav>
</body>
</html>`;
}

export function generateChapterXhtml(chapter: EpubChapter, bookLang = 'tr'): string {
  const paragraphs = chapter.content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const formattedParas = paragraphs.map((p, idx) => {
    const cls = idx === 0 ? ' class="first-para"' : '';
    return `<p${cls}>${escapeXml(p)}</p>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${escapeXml(bookLang)}">
<head>
  <meta charset="utf-8"/>
  <title>${escapeXml(chapter.title)}</title>
  <link rel="stylesheet" type="text/css" href="../style.css"/>
</head>
<body>
  <h2>${escapeXml(chapter.title)}</h2>
  ${formattedParas.join('\n  ')}
</body>
</html>`;
}
