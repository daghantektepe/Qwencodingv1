import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Search.css';

/**
 * Search — Faz 11: Proje geneli tam metin arama arayuzu.
 *
 * Islevler:
 *  - Arama kutusu ve sonuclar listesi.
 *  - Sorgu yazildikca (debounce 300ms) arama calisir.
 *  - Electron'da window.api.searchProject IPC kanali kullanilir; yoksa
 *    window.electronAPI.searchProject denenir; o da yoksa agac uzerinde
 *    renderer-tarafi fallback arama yapilir (gelistirme/tarayici modu).
 *  - Sonuca tiklaninca onSelectDoc(docId) cagrilir → o dokumana atlama
 *    (navigasyon/IPC baglantisi App tarafinda secim state'ini gunceller).
 *
 * props:
 *   tree: Node[] — renderer fallback aramasi icin proje agaci
 *   projectId: string — Electron IPC aramasina gonderilir
 *   open: boolean — panelin gorunurlugu
 *   onClose: () => void
 *   onSelectDoc: (docId: string) => void — navigasyon callback'i
 */

const DEBOUNCE_MS = 300;

// ---------------------------------------------------------------------------
// Renderer-tarafi fallback arama (Electron API yoksa / gelistirme modu)
// ---------------------------------------------------------------------------

const TR_MAP = {
  İ: 'i', I: 'ı', Ş: 'ş', S: 's', C: 'c', Ç: 'ç',
  Ö: 'ö', O: 'o', Ü: 'ü', U: 'u', G: 'ğ', Ğ: 'ğ',
};

export function foldForSearch(str) {
  const lower = String(str ?? '')
    .split('')
    .map((ch) => (TR_MAP[ch] !== undefined ? TR_MAP[ch] : ch))
    .join('')
    .toLowerCase();
  const map = { ı: 'i', ş: 's', ğ: 'g', ü: 'u', ö: 'o', ç: 'c', â: 'a', î: 'i', û: 'u', ô: 'o' };
  return lower.replace(/[ışğüöçâîûô]/g, (ch) => map[ch] || ch);
}

function makeSnippet(text, center, queryLen, radius = 60) {
  const start = Math.max(0, center - radius);
  const end = Math.min(text.length, center + queryLen + radius);
  let snip = text.slice(start, end).replace(/\s+/g, ' ').trim();
  if (start > 0) snip = '…' + snip;
  if (end < text.length) snip = snip + '…';
  return snip;
}

function searchTree(tree, query) {
  const q = String(query ?? '').trim();
  if (!q) return [];
  const foldedQuery = foldForSearch(q);
  const results = [];

  const walk = (nodes) => {
    for (const n of nodes || []) {
      if (n.type === 'doc') {
        const content = n.content || '';
        const haystack = foldForSearch(content);
        const indexes = [];
        let pos = haystack.indexOf(foldedQuery);
        while (pos !== -1 && indexes.length < 3) {
          indexes.push(pos);
          pos = haystack.indexOf(foldedQuery, pos + foldedQuery.length);
        }
        // Baslikta da eslesme ara
        const titleFolded = foldForSearch(n.title || '');
        const titleMatch = titleFolded.includes(foldedQuery);
        if (indexes.length > 0 || titleMatch) {
          results.push({
            docId: n.id,
            title: n.title,
            matchCount: indexes.length + (titleMatch ? 1 : 0),
            snippets: indexes.map((idx) => ({
              text: makeSnippet(content, idx, q.length),
              position: idx,
            })),
          });
        }
      }
      if (n.type === 'folder' && Array.isArray(n.children)) walk(n.children);
    }
  };
  walk(tree);
  results.sort((a, b) => b.matchCount - a.matchCount);
  return results;
}

// ---------------------------------------------------------------------------
// Bilesen
// ---------------------------------------------------------------------------

export default function Search({ tree = [], projectId = 'default', open = true, onClose, onSelectDoc }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // Panel acildiginda input'a odaklan
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const runSearch = useCallback(
    async (q) => {
      const trimmed = String(q ?? '').trim();
      if (!trimmed) {
        setResults([]);
        setError(null);
        setSearching(false);
        return;
      }
      setSearching(true);
      setError(null);
      try {
        // API cozumu: once window.api (task geregi), sonra window.electronAPI
        const api =
          (typeof window !== 'undefined' && window.api?.searchProject && window.api) ||
          (typeof window !== 'undefined' && window.electronAPI?.searchProject && window.electronAPI) ||
          null;

        if (api) {
          // Gercek Electron ortami: main process'teki dizin taranir
          const res = await api.searchProject({ projectId, query: trimmed, maxResults: 50 });
          if (res?.ok) {
            // Sonuc basliklarini agactan zenginlestir (main.js docId doner)
            const enriched = (res.results || []).map((r) => {
              const node = findDocById(tree, r.docId);
              return { ...r, title: node?.title || r.title || r.docId };
            });
            setResults(enriched);
          } else {
            setError(res?.error || 'Arama başarısız oldu.');
          }
        } else {
          // Tarayici/gelistirme ortami: renderer-agacinda yerel arama
          setResults(searchTree(tree, trimmed));
        }
      } catch (err) {
        setError(err.message || 'Arama sırasında hata oluştu.');
      } finally {
        setSearching(false);
      }
    },
    [projectId, tree]
  );

  // Debounce'lu arama tetikleme
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => runSearch(query), DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, runSearch]);

  // ESC ile kapatma
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && typeof onClose === 'function') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Sonuca tiklama → navigasyon: secili dokuman id'sini App'e ilet
  const handleResultClick = useCallback(
    (docId) => {
      if (typeof onSelectDoc === 'function') {
        onSelectDoc(docId);
        if (typeof onClose === 'function') onClose();
      }
    },
    [onSelectDoc, onClose]
  );

  if (!open) return null;

  return (
    <div className="search-panel" role="search" aria-label="Proje içinde ara">
      <div className="search-input-row">
        <span className="search-icon" aria-hidden="true">🔍</span>
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Tüm projede ara… (Esc ile kapat)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Arama sorgusu"
        />
        {query && (
          <button
            type="button"
            className="search-clear"
            onClick={() => setQuery('')}
            aria-label="Aramayı temizle"
          >
            ×
          </button>
        )}
        {typeof onClose === 'function' && (
          <button
            type="button"
            className="search-close"
            onClick={onClose}
            aria-label="Arama panelini kapat"
          >
            Kapat
          </button>
        )}
      </div>

      {searching && <div className="search-status">Aranıyor…</div>}
      {error && (
        <div className="search-error" role="alert">
          {error}
        </div>
      )}

      {!searching && query.trim() && results.length === 0 && !error && (
        <div className="search-empty">“{query.trim()}” için sonuç bulunamadı.</div>
      )}

      {results.length > 0 && (
        <>
          <div className="search-results-count">{results.length} dokümanda eşleşme</div>
          <ul className="search-results" aria-label="Arama sonuçları">
            {results.map((r) => (
              <li key={r.docId} className="search-result-item">
                <button
                  type="button"
                  className="search-result-btn"
                  onClick={() => handleResultClick(r.docId)}
                  title="Bu dokümana git"
                >
                  <span className="search-result-title">
                    📄 {r.title}
                    <span className="search-result-count">×{r.matchCount}</span>
                  </span>
                  {r.snippets?.length > 0 && (
                    <span className="search-result-snippet">{r.snippets[0].text}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/**
 * Agacta id'ye karsilik gelen dugumu bulur (IPC docId -> baslik cozumu).
 */
function findDocById(tree, docId) {
  const walk = (nodes) => {
    for (const n of nodes || []) {
      if (n.id === docId) return n;
      if (n.type === 'folder' && Array.isArray(n.children)) {
        const found = walk(n.children);
        if (found) return found;
      }
    }
    return null;
  };
  return walk(tree);
}
