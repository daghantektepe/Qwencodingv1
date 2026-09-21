import { FileText, Folder, Moon, PanelRight, Save, Search, Sun } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  ScrivNode,
  countWords,
  createSampleProject,
  findNode,
  flattenNodes,
  projectWordCount,
  updateNode,
} from './lib/project';

function BinderItem({ node, activeId, onSelect, depth = 0 }: {
  node: ScrivNode;
  activeId: string;
  onSelect: (id: string) => void;
  depth?: number;
}) {
  const Icon = node.type === 'folder' ? Folder : FileText;
  return (
    <>
      <button
        className={`binder-item ${activeId === node.id ? 'active' : ''}`}
        style={{ paddingLeft: 12 + depth * 18 }}
        onClick={() => onSelect(node.id)}
        type="button"
      >
        <Icon size={16} aria-hidden="true" />
        <span>{node.title}</span>
      </button>
      {node.children.map((child) => (
        <BinderItem key={child.id} node={child} activeId={activeId} onSelect={onSelect} depth={depth + 1} />
      ))}
    </>
  );
}

export function App() {
  const [project, setProject] = useState(createSampleProject);
  const firstDocument = useMemo(
    () => flattenNodes(project.documents).find((node) => node.type === 'document') ?? project.documents[0],
    [project.documents],
  );
  const [activeId, setActiveId] = useState(firstDocument.id);
  const [dark, setDark] = useState(false);
  const active = findNode(project.documents, activeId) ?? firstDocument;
  const wordCount = projectWordCount(project);
  const activeWords = countWords(active.text);
  const progress = Math.min(100, Math.round((wordCount / project.targetWords) * 100));
  const visibleNodes = flattenNodes(project.documents);

  function patchActive(patch: Partial<ScrivNode>) {
    setProject((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      documents: updateNode(current.documents, active.id, patch),
    }));
  }

  return (
    <main className={dark ? 'app dark' : 'app'}>
      <aside className="sidebar" aria-label="Binder">
        <div className="brand">
          <div>
            <strong>OpenScriv</strong>
            <span>{project.title}</span>
          </div>
          <button className="icon-button" type="button" aria-label="Toggle theme" onClick={() => setDark((value) => !value)}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <label className="search-box">
          <Search size={16} aria-hidden="true" />
          <input placeholder="Search binder" aria-label="Search binder" />
        </label>
        <nav className="binder-list">
          {project.documents.map((node) => (
            <BinderItem key={node.id} node={node} activeId={active.id} onSelect={setActiveId} />
          ))}
        </nav>
      </aside>

      <section className="editor-shell">
        <header className="toolbar">
          <input
            className="title-input"
            value={active.title}
            aria-label="Document title"
            onChange={(event) => patchActive({ title: event.target.value })}
          />
          <div className="toolbar-actions">
            <span>{activeWords} words</span>
            <button className="icon-button" type="button" aria-label="Save snapshot">
              <Save size={18} />
            </button>
          </div>
        </header>

        {active.type === 'document' ? (
          <textarea
            className="editor"
            aria-label="Manuscript editor"
            value={active.text ?? ''}
            onChange={(event) => patchActive({ text: event.target.value })}
            spellCheck="true"
          />
        ) : (
          <div className="corkboard" aria-label="Folder corkboard">
            {active.children.length ? active.children.map((child) => (
              <button key={child.id} className="index-card" type="button" onClick={() => setActiveId(child.id)}>
                <strong>{child.title}</strong>
                <span>{child.synopsis || 'No synopsis yet'}</span>
              </button>
            )) : <p>This folder is empty.</p>}
          </div>
        )}
      </section>

      <aside className="inspector" aria-label="Inspector">
        <div className="panel-heading">
          <PanelRight size={18} aria-hidden="true" />
          <strong>Inspector</strong>
        </div>
        <label>
          Synopsis
          <textarea value={active.synopsis} onChange={(event) => patchActive({ synopsis: event.target.value })} />
        </label>
        <label>
          Status
          <select value={active.status} onChange={(event) => patchActive({ status: event.target.value })}>
            <option>Drafting</option>
            <option>Revising</option>
            <option>Done</option>
            <option>Collecting</option>
          </select>
        </label>
        <label>
          Label
          <input value={active.label} onChange={(event) => patchActive({ label: event.target.value })} />
        </label>
        <label>
          Target words
          <input
            type="number"
            min="0"
            value={active.targetWords}
            onChange={(event) => patchActive({ targetWords: Number(event.target.value) })}
          />
        </label>
        <div className="progress-block">
          <span>Project progress</span>
          <strong>{wordCount.toLocaleString()} / {project.targetWords.toLocaleString()}</strong>
          <div className="progress-track"><div style={{ width: `${progress}%` }} /></div>
        </div>
        <div className="outline-count">{visibleNodes.length} binder items</div>
      </aside>
    </main>
  );
}
