/**
 * Default CSS Template for Compile Engine
 * Used for HTML and PDF exports
 * 
 * Tipografik olarak kusursuz, production-ready CSS şablonu
 */

export const DEFAULT_CSS = `
/* ============================================
   Reset and Base Styles
   ============================================ */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* ============================================
   Typography - Base
   ============================================ */
body {
  font-family: 'Georgia', 'Times New Roman', serif;
  line-height: 1.8;
  color: #333;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: #fff;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* ============================================
   Title Page
   ============================================ */
.title-page {
  text-align: center;
  padding: 4rem 0;
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  page-break-after: always;
}

.book-title {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #1a1a1a;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.book-author {
  font-size: 1.5rem;
  font-style: italic;
  color: #666;
  margin-top: 1rem;
}

.book-date {
  font-size: 1rem;
  color: #999;
  margin-top: 2rem;
}

.publisher {
  font-size: 0.9rem;
  color: #999;
  margin-top: 3rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* ============================================
   Table of Contents
   ============================================ */
.toc {
  page-break-after: always;
  margin-bottom: 3rem;
}

.toc h2 {
  font-size: 2rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #333;
  padding-bottom: 0.5rem;
  color: #1a1a1a;
}

.toc ol {
  list-style: none;
  counter-reset: toc-counter;
  padding-left: 0;
}

.toc li {
  counter-increment: toc-counter;
  margin: 0.75rem 0;
  padding: 0.25rem 0;
  border-bottom: 1px dotted #ddd;
}

.toc li::before {
  content: counter(toc-counter) ". ";
  font-weight: bold;
  color: #666;
  margin-right: 0.5rem;
}

.toc-level-1 {
  font-weight: bold;
  font-size: 1.1rem;
}

.toc-level-2 {
  margin-left: 2rem;
  font-size: 1rem;
}

.toc-level-3 {
  margin-left: 4rem;
  font-size: 0.95rem;
  color: #666;
}

.toc a {
  color: #333;
  text-decoration: none;
  transition: color 0.2s ease;
}

.toc a:hover {
  color: #0066cc;
  text-decoration: underline;
}

/* ============================================
   Chapter Styles
   ============================================ */
.chapter {
  page-break-before: always;
  margin-bottom: 3rem;
}

.chapter:first-of-type {
  page-break-before: auto;
}

.chapter h1,
.chapter h2,
.chapter h3,
.chapter h4 {
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: #1a1a1a;
  line-height: 1.3;
  page-break-after: avoid;
}

.chapter h1 {
  font-size: 2.5rem;
  border-bottom: 3px solid #333;
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
}

.chapter h2 {
  font-size: 2rem;
  border-bottom: 2px solid #666;
  padding-bottom: 0.3rem;
}

.chapter h3 {
  font-size: 1.5rem;
}

.chapter h4 {
  font-size: 1.25rem;
  font-style: italic;
}

/* ============================================
   Content Styles
   ============================================ */
.chapter-content {
  text-align: justify;
  hyphens: auto;
  -webkit-hyphens: auto;
  -ms-hyphens: auto;
}

.chapter-content p {
  margin-bottom: 1rem;
  text-indent: 2rem;
  orphans: 3;
  widows: 3;
}

.chapter-content p:first-of-type {
  text-indent: 0;
}

/* Drop Cap - İlk paragrafın ilk harfi büyük */
.chapter-content p:first-of-type::first-letter {
  font-size: 2.5em;
  font-weight: bold;
  float: left;
  line-height: 1;
  margin-right: 0.1em;
  margin-top: 0.1em;
  color: #333;
}

.chapter-content strong {
  font-weight: bold;
  color: #1a1a1a;
}

.chapter-content em {
  font-style: italic;
}

.chapter-content blockquote {
  margin: 1.5rem 2rem;
  padding: 1rem 1.5rem;
  border-left: 4px solid #666;
  background: #f9f9f9;
  font-style: italic;
  color: #555;
  page-break-inside: avoid;
}

.chapter-content code {
  font-family: 'Courier New', monospace;
  background: #f4f4f4;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-size: 0.9em;
}

.chapter-content pre {
  background: #f4f4f4;
  padding: 1rem;
  border-radius: 5px;
  overflow-x: auto;
  margin: 1.5rem 0;
  page-break-inside: avoid;
}

.chapter-content pre code {
  background: none;
  padding: 0;
}

.chapter-content ul,
.chapter-content ol {
  margin: 1rem 2rem;
  padding-left: 1.5rem;
}

.chapter-content li {
  margin-bottom: 0.5rem;
}

.chapter-content hr {
  border: none;
  border-top: 2px solid #ddd;
  margin: 2rem 0;
}

.chapter-content img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1.5rem auto;
  page-break-inside: avoid;
}

.chapter-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  page-break-inside: avoid;
}

.chapter-content th,
.chapter-content td {
  border: 1px solid #ddd;
  padding: 0.75rem;
  text-align: left;
}

.chapter-content th {
  background: #f4f4f4;
  font-weight: bold;
}

/* ============================================
   Page Break Utilities
   ============================================ */
.page-break {
  border: none;
  page-break-after: always;
  margin: 3rem 0;
}

.page-break-before {
  page-break-before: always;
}

/* ============================================
   Print Styles
   ============================================ */
@media print {
  body {
    padding: 0;
    max-width: none;
    font-size: 12pt;
    color: #000;
  }

  .chapter {
    page-break-before: always;
  }

  .chapter:first-of-type {
    page-break-before: auto;
  }

  .toc {
    page-break-after: always;
  }

  a {
    color: #000;
    text-decoration: none;
  }

  /* Avoid orphaned headings */
  h1, h2, h3, h4 {
    page-break-after: avoid;
  }

  /* Avoid breaking inside elements */
  table, figure, blockquote, pre {
    page-break-inside: avoid;
  }

  /* Remove shadows and backgrounds for print */
  body {
    box-shadow: none;
  }
}

/* ============================================
   Screen-specific styles
   ============================================ */
@media screen {
  body {
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  }
}

/* ============================================
   Responsive adjustments
   ============================================ */
@media (max-width: 768px) {
  body {
    padding: 1rem;
  }

  .book-title {
    font-size: 2rem;
  }

  .book-author {
    font-size: 1.2rem;
  }

  .chapter h1 {
    font-size: 1.8rem;
  }

  .chapter h2 {
    font-size: 1.5rem;
  }

  .toc-level-2 {
    margin-left: 1rem;
  }

  .toc-level-3 {
    margin-left: 2rem;
  }

  .chapter-content blockquote {
    margin: 1rem;
    padding: 0.75rem 1rem;
  }
}

/* ============================================
   Accessibility
   ============================================ */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}

@media (prefers-color-scheme: dark) {
  /* Only apply to screen, not print */
  @media screen {
    body {
      background: #fff;
      color: #333;
    }
  }
}
`;

export default DEFAULT_CSS;
