import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ScreenplayDocument, ScreenplayElement } from '../../types/screenplay';
import { fountainParser } from '../../services/screenplay/fountainParser';
import { fountainExporter } from '../../services/screenplay/fountainExporter';
import ScreenplayToolbar from './ScreenplayToolbar';
import { FileText, Save, Download, Eye } from 'lucide-react';

interface ScreenplayEditorProps {
  initialText?: string;
  onSave?: (text: string) => void;
  onExport?: (format: 'fountain' | 'html' | 'pdf') => void;
}

export default function ScreenplayEditor({
  initialText = '',
  onSave,
  onExport,
}: ScreenplayEditorProps) {
  const [text, setText] = useState(initialText);
  const [document, setDocument] = useState<ScreenplayDocument | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
  const [isModified, setIsModified] = useState(false);
  const [currentElementIndex, setCurrentElementIndex] = useState(0);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Parse text on change
  useEffect(() => {
    try {
      const parsed = fountainParser.parse(text);
      setDocument(parsed);
    } catch (error) {
      console.error('Parse error:', error);
    }
  }, [text]);

  // Handle text change
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setIsModified(true);
  }, []);

  // Handle save
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(text);
      setIsModified(false);
    }
  }, [text, onSave]);

  // Handle export
  const handleExport = useCallback(
    (format: 'fountain' | 'html' | 'pdf') => {
      if (!document) return;

      let content: string;
      let filename: string;
      let mimeType: string;

      switch (format) {
        case 'fountain':
          content = fountainExporter.export(document);
          filename = 'screenplay.fountain';
          mimeType = 'text/plain';
          break;
        case 'html':
          content = fountainExporter.exportHTML(document);
          filename = 'screenplay.html';
          mimeType = 'text/html';
          break;
        case 'pdf':
          // PDF export would require additional library
          alert('PDF export not yet implemented');
          return;
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      if (onExport) {
        onExport(format);
      }
    },
    [document, onExport]
  );

  // Handle element click in preview mode
  const handleElementClick = useCallback((index: number) => {
    setCurrentElementIndex(index);
    setViewMode('edit');

    // Scroll to element in editor
    if (editorRef.current && document) {
      const element = document.elements[index];
      if (element.lineNumber !== undefined) {
        const lines = text.split('\n');
        const position = lines
          .slice(0, element.lineNumber)
          .reduce((pos, line) => pos + line.length + 1, 0);
        editorRef.current.setSelectionRange(position, position);
        editorRef.current.focus();
      }
    }
  }, [document, text]);

  // Render element with appropriate styling
  const renderElement = (element: ScreenplayElement, index: number) => {
    const baseClasses = 'mb-2 cursor-pointer hover:bg-gray-50 p-1 rounded';
    const isSelected = index === currentElementIndex;

    switch (element.type) {
      case 'scene_heading':
        return (
          <div
            key={index}
            className={`${baseClasses} font-bold uppercase mt-6 ${
              isSelected ? 'bg-blue-100' : ''
            }`}
            onClick={() => handleElementClick(index)}
          >
            {element.text}
          </div>
        );
      case 'character':
        return (
          <div
            key={index}
            className={`${baseClasses} font-bold uppercase ml-20 mt-4 ${
              isSelected ? 'bg-blue-100' : ''
            }`}
            onClick={() => handleElementClick(index)}
          >
            {element.text}
          </div>
        );
      case 'parenthetical':
        return (
          <div
            key={index}
            className={`${baseClasses} italic ml-16 ${
              isSelected ? 'bg-blue-100' : ''
            }`}
            onClick={() => handleElementClick(index)}
          >
            {element.text}
          </div>
        );
      case 'dialogue':
        return (
          <div
            key={index}
            className={`${baseClasses} ml-12 mr-8 ${
              isSelected ? 'bg-blue-100' : ''
            }`}
            onClick={() => handleElementClick(index)}
          >
            {element.text}
          </div>
        );
      case 'transition':
        return (
          <div
            key={index}
            className={`${baseClasses} uppercase text-right font-semibold mt-4 ${
              isSelected ? 'bg-blue-100' : ''
            }`}
            onClick={() => handleElementClick(index)}
          >
            {element.text}
          </div>
        );
      case 'action':
        return (
          <div
            key={index}
            className={`${baseClasses} ${isSelected ? 'bg-blue-100' : ''}`}
            onClick={() => handleElementClick(index)}
          >
            {element.text}
          </div>
        );
      case 'section':
        const level = element.sectionLevel || 1;
        const headingClass = level === 1 ? 'text-2xl' : level === 2 ? 'text-xl' : 'text-lg';
        return (
          <div
            key={index}
            className={`${baseClasses} font-bold ${headingClass} mt-8 ${
              isSelected ? 'bg-blue-100' : ''
            }`}
            onClick={() => handleElementClick(index)}
          >
            {element.text}
          </div>
        );
      case 'synopsis':
        return (
          <div
            key={index}
            className={`${baseClasses} italic text-gray-600 ${
              isSelected ? 'bg-blue-100' : ''
            }`}
            onClick={() => handleElementClick(index)}
          >
            {element.text}
          </div>
        );
      case 'note':
        return (
          <div
            key={index}
            className={`${baseClasses} bg-yellow-50 border-l-4 border-yellow-400 p-2 ${
              isSelected ? 'bg-yellow-100' : ''
            }`}
            onClick={() => handleElementClick(index)}
          >
            <span className="text-sm text-gray-600">Note:</span> {element.text}
          </div>
        );
      case 'page_break':
        return (
          <div
            key={index}
            className="border-t-2 border-dashed border-gray-300 my-8"
            onClick={() => handleElementClick(index)}
          />
        );
      default:
        return (
          <div
            key={index}
            className={baseClasses}
            onClick={() => handleElementClick(index)}
          >
            {element.text}
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Toolbar */}
      <ScreenplayToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSave={handleSave}
        onExport={handleExport}
        isModified={isModified}
        wordCount={document?.metadata?.wordCount || 0}
        elementCount={document?.elements.length || 0}
      />

      {/* Editor/Preview Area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'edit' && (
          <div className="h-full p-4">
            <textarea
              ref={editorRef}
              value={text}
              onChange={handleTextChange}
              className="w-full h-full p-6 font-mono text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Start writing your screenplay in Fountain format...

Example:
Title: My Screenplay
Author: John Doe

INT. COFFEE SHOP - DAY

JOHN sits at a table, sipping coffee.

JOHN
(to himself)
This is the beginning of something great.

FADE OUT."
              spellCheck={false}
            />
          </div>
        )}

        {viewMode === 'preview' && document && (
          <div className="h-full overflow-y-auto p-8 max-w-4xl mx-auto">
            {document.titlePage && (
              <div className="text-center mb-12 border-b-2 border-gray-200 pb-8">
                <h1 className="text-3xl font-bold mb-4">{document.titlePage.title}</h1>
                {document.titlePage.author && (
                  <p className="text-xl text-gray-600">by {document.titlePage.author}</p>
                )}
              </div>
            )}
            <div className="font-mono text-sm leading-relaxed">
              {document.elements.map((element, index) => renderElement(element, index))}
            </div>
          </div>
        )}

        {viewMode === 'split' && document && (
          <div className="h-full flex">
            {/* Editor */}
            <div className="w-1/2 border-r border-gray-200 p-4">
              <textarea
                ref={editorRef}
                value={text}
                onChange={handleTextChange}
                className="w-full h-full p-4 font-mono text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                spellCheck={false}
              />
            </div>
            {/* Preview */}
            <div className="w-1/2 overflow-y-auto p-8">
              <div className="font-mono text-sm leading-relaxed">
                {document.elements.map((element, index) => renderElement(element, index))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span>Fountain Format</span>
          <span>•</span>
          <span>{document?.metadata?.wordCount || 0} words</span>
          <span>•</span>
          <span>{document?.elements.length || 0} elements</span>
        </div>
        <div className="flex items-center gap-4">
          {isModified && (
            <>
              <span className="text-amber-600">Modified</span>
              <span>•</span>
            </>
          )}
          <span>Line {currentElementIndex + 1}</span>
        </div>
      </div>
    </div>
  );
}
