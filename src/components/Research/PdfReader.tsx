import React, { useState, useRef, useEffect } from 'react';
import styles from './PdfReader.module.css';

interface PdfReaderProps {
  src: string;
  title: string;
  notes?: string;
  onNotesChange?: (notes: string) => void;
}

const PdfReader: React.FC<PdfReaderProps> = ({ src, title, notes = '', onNotesChange }) => {
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };

  const toggleFullscreen = () => {
    if (!iframeRef.current) return;
    
    if (!document.fullscreenElement) {
      iframeRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const adjustZoom = (delta: number) => {
    setZoom(prev => Math.min(Math.max(prev + delta, 50), 300));
  };

  const downloadPdf = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `${title}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`${styles.container} ${isFullscreen ? styles.fullscreen : ''}`}>
      <header className={styles.header}>
        <h2>{title}</h2>
        <div className={styles.controls}>
          <button onClick={() => adjustZoom(-10)} aria-label="Zoom Out">-</button>
          <span>{zoom}%</span>
          <button onClick={() => adjustZoom(10)} aria-label="Zoom In">+</button>
          <button onClick={toggleFullscreen} aria-label="Toggle Fullscreen">
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
          <button onClick={downloadPdf} aria-label="Download PDF">
            Download
          </button>
        </div>
      </header>

      <main className={styles.mainContent}>
        <iframe
          ref={iframeRef}
          src={src}
          width="100%"
          height="800px"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
          title={title}
          className={styles.pdfFrame}
        />
        
        <aside className={styles.notesPanel}>
          <h3>Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange?.(e.target.value)}
            placeholder="Add your notes here..."
            className={styles.noteArea}
          />
        </aside>
      </main>
    </div>
  );
};

export default PdfReader;
