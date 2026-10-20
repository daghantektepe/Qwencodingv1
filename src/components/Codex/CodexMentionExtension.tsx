import React, { useState, useCallback } from 'react';
import { Mark, mergeAttributes } from '@tiptap/core';
import { Character } from '../../types/codex';
import { getCodexStore } from '../../services/codexStore';

export interface Mention {
  id: string;
  name: string;
}

export interface CodexMentionOptions {
  HTMLAttributes: Record<string, any>;
  suggestion: {
    items: (query: string) => Character[];
    render: () => any;
  };
}

export interface CodexMentionAttributes {
  id: string;
  label: string;
  role: string;
  color?: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    codexMention: {
      addCodexMention: (attributes: CodexMentionAttributes) => ReturnType;
    };
  }
}

export const CodexMentionExtension = Mark.create<CodexMentionOptions>({
  name: 'codexMention',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'codex-mention',
        'data-type': 'codexMention',
      },
      suggestion: {
        items: (query: string) => {
          const store = getCodexStore();
          const state = store.getState();
          if (!query) return state.characters;
          return state.characters.filter((character) =>
            character.name.toLowerCase().includes(query.toLowerCase())
          );
        },
        render: () => {
          return {
            onStart: () => {},
            onUpdate: () => {},
            onKeyDown: () => false,
            onExit: () => {},
          };
        },
      },
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-id'),
        renderHTML: (attributes) => {
          if (!attributes.id) return {};
          return { 'data-id': attributes.id };
        },
      },
      label: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-label'),
        renderHTML: (attributes) => {
          if (!attributes.label) return {};
          return { 'data-label': attributes.label };
        },
      },
      role: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-role'),
        renderHTML: (attributes) => {
          if (!attributes.role) return {};
          return { 'data-role': attributes.role };
        },
      },
      color: {
        default: '#6366f1',
        parseHTML: (element) => element.getAttribute('data-color') || '#6366f1',
        renderHTML: (attributes) => {
          const col = attributes.color || '#6366f1';
          return { 'data-color': col };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="codexMention"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const color = HTMLAttributes['data-color'] || HTMLAttributes.color || '#6366f1';
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        style: `border-left: 3px solid ${color}; padding-left: 4px; background-color: #eef2ff; border-radius: 4px;`,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      addCodexMention:
        (attributes: CodexMentionAttributes) =>
        ({ commands }) => {
          const color = attributes.color || '#6366f1';
          return commands.insertContent({
            type: 'text',
            text: `@${attributes.label}`,
            marks: [
              {
                type: this.name,
                attrs: {
                  ...attributes,
                  color,
                },
              },
            ],
          });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      '@': () => {
        return this.editor.commands.insertContent('@');
      },
    };
  },
});

interface CodexMentionComponentProps {
  text: string;
  mentions: Mention[];
  onMentionClick?: (mention: Mention) => void;
  compact?: boolean;
}

export const highlightText = (text: string, mentions: Mention[]): React.ReactNode[] => {
  if (!text) return [];
  if (!mentions || mentions.length === 0) return [text];

  const escapedNames = mentions.map((m) => m.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`\\b(${escapedNames.join('|')})\\b`, 'gi');

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const matchedName = match[1];
    const mentionObj = mentions.find((m) => m.name.toLowerCase() === matchedName.toLowerCase());

    if (mentionObj) {
      parts.push(
        <span
          key={`${mentionObj.id}-${match.index}`}
          className="codex-mention-highlight cursor-pointer text-indigo-600 font-medium"
          data-mention-id={mentionObj.id}
        >
          {matchedName}
        </span>
      );
    } else {
      parts.push(matchedName);
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
};

export const MentionMarker: React.FC<{ mention: Mention }> = ({ mention }) => {
  return <span className="codex-mention-marker">@{mention.name}</span>;
};

const CodexMentionComponent: React.FC<CodexMentionComponentProps> = ({
  text,
  mentions,
  onMentionClick,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(!compact);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLSpanElement>) => {
      const target = e.target as HTMLElement;
      const mentionId = target.getAttribute('data-mention-id');

      if (mentionId && onMentionClick) {
        const mention = mentions.find((m) => m.id === mentionId);
        if (mention) {
          onMentionClick(mention);
        }
      }
    },
    [mentions, onMentionClick]
  );

  const toggleExpand = () => {
    if (compact) {
      setIsExpanded((prev) => !prev);
    }
  };

  const displayText = compact && !isExpanded ? text.substring(0, 50) + '...' : text;

  return (
    <div className={`codex-mention-extension ${compact ? 'compact' : ''}`}>
      <p className="codex-text-content" onClick={handleClick}>
        {highlightText(displayText, mentions)}
      </p>
      {compact && (
        <button className="codex-toggle-btn" onClick={toggleExpand}>
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      )}
    </div>
  );
};

export default CodexMentionComponent;
