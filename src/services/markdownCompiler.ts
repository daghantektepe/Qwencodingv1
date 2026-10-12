/**
 * Markdown Compiler Service
 * Derleme motoru: Document'leri Markdown/HTML formatında birleştirir
 */

export interface CompileOptions {
  title: string;
  author?: string;
  includeTOC?: boolean;
  includeTitlePage?: boolean;
  format: 'markdown' | 'html' | 'pdf' | 'epub';
  cssTemplate?: string;
}

export interface DocumentNode {
  docId: string;
  title: string;
  content: string;
  level?: number;
}

/**
 * Document'leri Markdown formatında birleştirir
 */
export function compileToMarkdown(
  documents: DocumentNode[],
  options: CompileOptions
): string {
  let output = '';

  // Başlık sayfası
  if (options.includeTitlePage) {
    output += `# ${options.title}\n\n`;
    if (options.author) {
      output += `*${options.author}*\n\n`;
    }
    output += `---\n\n`;
  }

  // İçindekiler
  if (options.includeTOC) {
    output += `## İçindekiler\n\n`;
    documents.forEach((doc, index) => {
      const level = doc.level || 1;
      const indent = '  '.repeat(level - 1);
      const anchor = doc.title.toLowerCase().replace(/\s+/g, '-');
      output += `${indent}${index + 1}. [${doc.title}](#${anchor})\n`;
    });
    output += `\n---\n\n`;
  }

  // Document içerikleri
  documents.forEach((doc) => {
    const level = doc.level || 1;
    const heading = '#'.repeat(level + 1);
    output += `${heading} ${doc.title}\n\n`;
    output += `${doc.content}\n\n`;
    output += `---\n\n`;
  });

  return output;
}

/**
 * Document'leri HTML formatında birleştirir
 */
export function compileToHTML(
  documents: DocumentNode[],
  options: CompileOptions
): string {
  const css = options.cssTemplate || getDefaultCSS();

  let bodyContent = '';

  // Başlık sayfası
  if (options.includeTitlePage) {
    bodyContent += `
      <div class="title-page">
        <h1 class="book-title">${escapeHTML(options.title)}</h1>
        ${options.author ? `<p class="book-author">${escapeHTML(options.author)}</p>` : ''}
      </div>
      <hr class="page-break">
    `;
  }

  // İçindekiler
  if (options.includeTOC) {
    bodyContent += `
      <nav class="toc">
        <h2>İçindekiler</h2>
        <ol>
          ${documents.map((doc, index) => {
            const level = doc.level || 1;
            const anchor = doc.title.toLowerCase().replace(/\s+/g, '-');
            return `<li class="toc-level-${level}"><a href="#${anchor}">${escapeHTML(doc.title)}</a></li>`;
          }).join('\n          ')}
        </ol>
      </nav>
      <hr class="page-break">
    `;
  }

  // Document içerikleri
  documents.forEach((doc) => {
    const level = doc.level || 1;
    const headingTag = `h${level + 1}`;
    const anchor = doc.title.toLowerCase().replace(/\s+/g, '-');
    
    bodyContent += `
      <section class="chapter" id="${anchor}">
        <${headingTag}>${escapeHTML(doc.title)}</${headingTag}>
        <div class="chapter-content">
          ${markdownToHTML(doc.content)}
        </div>
      </section>
      <hr class="page-break">
    `;
  });

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(options.title)}</title>
  ${options.author ? `<meta name="author" content="${escapeHTML(options.author)}">` : ''}
  <style>
    ${css}
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>`;
}

/**
 * Basit Markdown-to-HTML dönüştürücü
 */
export function markdownToHTML(markdown: string): string {
  let html = markdown;

  // Başlıklar
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Kalın ve italik
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Paragraflar
  html = html.replace(/\n\n/g, '</p><p>');
  html = `<p>${html}</p>`;

  // Satır sonları
  html = html.replace(/\n/g, '<br>');

  return html;
}

/**
 * HTML'den özel karakterleri temizler
 */
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Varsayılan CSS şablonu
 */
function getDefaultCSS(): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      line-height: 1.8;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      background: #fff;
    }
    
    .title-page {
      text-align: center;
      padding: 4rem 0;
      min-height: 80vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    
    .book-title {
      font-size: 3rem;
      font-weight: bold;
      margin-bottom: 1rem;
      color: #1a1a1a;
    }
    
    .book-author {
      font-size: 1.5rem;
      font-style: italic;
      color: #666;
    }
    
    .toc {
      page-break-after: always;
    }
    
    .toc h2 {
      font-size: 2rem;
      margin-bottom: 2rem;
      border-bottom: 2px solid #333;
      padding-bottom: 0.5rem;
    }
    
    .toc ol {
      list-style: none;
      counter-reset: toc-counter;
    }
    
    .toc li {
      counter-increment: toc-counter;
      margin: 0.5rem 0;
    }
    
    .toc li::before {
      content: counter(toc-counter) ". ";
      font-weight: bold;
    }
    
    .toc-level-2 {
      margin-left: 2rem;
    }
    
    .toc-level-3 {
      margin-left: 4rem;
    }
    
    .toc a {
      color: #333;
      text-decoration: none;
    }
    
    .toc a:hover {
      text-decoration: underline;
    }
    
    .chapter {
      page-break-before: always;
      margin-bottom: 3rem;
    }
    
    .chapter h1, .chapter h2, .chapter h3 {
      margin-top: 2rem;
      margin-bottom: 1rem;
      color: #1a1a1a;
    }
    
    .chapter h1 {
      font-size: 2.5rem;
      border-bottom: 3px solid #333;
      padding-bottom: 0.5rem;
    }
    
    .chapter h2 {
      font-size: 2rem;
    }
    
    .chapter h3 {
      font-size: 1.5rem;
    }
    
    .chapter-content p {
      margin-bottom: 1rem;
      text-align: justify;
      text-indent: 2rem;
    }
    
    .chapter-content p:first-of-type {
      text-indent: 0;
    }
    
    .chapter-content strong {
      font-weight: bold;
    }
    
    .chapter-content em {
      font-style: italic;
    }
    
    .page-break {
      border: none;
      page-break-after: always;
      margin: 3rem 0;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .chapter {
        page-break-before: always;
      }
    }
  `;
}

export { getDefaultCSS };
