import React from 'react';
import { SpellcheckerService, SpellCheckResult } from '../../services/native/spellcheckerService';

interface ContextMenuSpellcheckProps {
  x: number;
  y: number;
  word: string;
  checkResult: SpellCheckResult;
  onApplySuggestion: (suggestion: string) => void;
  onClose: () => void;
}

export const ContextMenuSpellcheck: React.FC<ContextMenuSpellcheckProps> = ({
  x,
  y,
  word,
  checkResult,
  onApplySuggestion,
  onClose,
}) => {
  const handleAddToDict = async () => {
    await SpellcheckerService.addCustomWord(word);
    onClose();
  };

  return (
    <div
      role="menu"
      data-testid="spellcheck-context-menu"
      style={{
        position: 'fixed',
        left: x,
        top: y,
        backgroundColor: '#2a2620',
        color: '#f5f2ea',
        border: '1px solid #4a443a',
        borderRadius: '6px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        padding: '6px 0',
        zIndex: 99999,
        minWidth: '180px',
        fontSize: '13px',
      }}
    >
      <div
        style={{
          padding: '4px 12px',
          color: '#8c8273',
          borderBottom: '1px solid #38332a',
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        İmla Önerileri ({word})
      </div>

      {checkResult.suggestions.length > 0 ? (
        checkResult.suggestions.map((suggestion) => (
          <div
            key={suggestion}
            role="menuitem"
            data-testid={`spellcheck-suggestion-${suggestion}`}
            onClick={() => {
              onApplySuggestion(suggestion);
              onClose();
            }}
            style={{
              padding: '6px 14px',
              cursor: 'pointer',
              fontWeight: 500,
              color: '#4ade80',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#38332a')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {suggestion}
          </div>
        ))
      ) : (
        <div style={{ padding: '6px 14px', color: '#8c8273', fontStyle: 'italic' }}>
          Öneri bulunamadı
        </div>
      )}

      <div style={{ borderTop: '1px solid #38332a', margin: '4px 0' }} />

      <div
        role="menuitem"
        data-testid="spellcheck-add-dictionary"
        onClick={handleAddToDict}
        style={{
          padding: '6px 14px',
          cursor: 'pointer',
          color: '#e5c07b',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#38332a')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        📖 Sözlüğe Ekle ("{word}")
      </div>
    </div>
  );
};
