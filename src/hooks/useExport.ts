/**
 * useExport Hook
 * Export işlemlerini yöneten React hook'u
 * CompileEngine ile entegre çalışır
 */

import { useState, useCallback, useRef } from 'react';
import {
  compileDocuments,
  downloadCompileResult,
  loadCompileSettings,
  saveCompileSettings,
  getSupportedFormats,
  type CompileRequest,
  type CompileResult,
  type CompileProgress,
  type CompileFormat,
} from '../services/compile/CompileEngine';
import type { DocumentNode } from '../services/markdownCompiler';

export interface UseExportReturn {
  /** Export işlemini başlatır */
  startExport: (request: CompileRequest) => Promise<CompileResult>;
  /** Son export sonucunu indirir */
  downloadLastResult: () => void;
  /** Son export sonucu */
  lastResult: CompileResult | null;
  /** İlerleme durumu */
  progress: CompileProgress | null;
  /** Export işlemi devam ediyor mu */
  isExporting: boolean;
  /** Hata mesajı */
  error: string | null;
  /** Kaydedilmiş ayarları yükler */
  loadSettings: () => Partial<CompileRequest>;
  /** Ayarları kaydeder */
  saveSettings: (settings: Partial<CompileRequest>) => void;
  /** Desteklenen formatları döndürür */
  getFormats: () => ReturnType<typeof getSupportedFormats>;
}

/**
 * Export işlemlerini yöneten hook
 */
export function useExport(): UseExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<CompileProgress | null>(null);
  const [lastResult, setLastResult] = useState<CompileResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<CompileResult | null>(null);

  const startExport = useCallback(async (request: CompileRequest): Promise<CompileResult> => {
    setIsExporting(true);
    setError(null);
    setProgress({ stage: 'Başlatılıyor...', percent: 0 });
    setLastResult(null);
    resultRef.current = null;

    try {
      const result = await compileDocuments(request, (p) => {
        setProgress(p);
      });

      setLastResult(result);
      resultRef.current = result;

      if (!result.success) {
        setError(result.error || 'Derleme başarısız oldu');
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(message);
      
      const errorResult: CompileResult = {
        success: false,
        error: message,
        format: request.format,
      };
      
      setLastResult(errorResult);
      resultRef.current = errorResult;
      
      return errorResult;
    } finally {
      setIsExporting(false);
    }
  }, []);

  const downloadLastResult = useCallback(() => {
    if (resultRef.current) {
      downloadCompileResult(resultRef.current);
    }
  }, []);

  const loadSettings = useCallback((): Partial<CompileRequest> => {
    return loadCompileSettings();
  }, []);

  const saveSettingsFn = useCallback((settings: Partial<CompileRequest>) => {
    saveCompileSettings(settings);
  }, []);

  const getFormats = useCallback(() => {
    return getSupportedFormats();
  }, []);

  return {
    startExport,
    downloadLastResult,
    lastResult,
    progress,
    isExporting,
    error,
    loadSettings,
    saveSettings: saveSettingsFn,
    getFormats,
  };
}

/**
 * Document'leri DocumentNode formatına dönüştürür
 */
export function toDocumentNodes(
  documents: Array<{ docId: string; title: string; content: string; folder?: string }>,
  selectedIds?: string[]
): DocumentNode[] {
  const filtered = selectedIds
    ? documents.filter(d => selectedIds.includes(d.docId))
    : documents;

  return filtered.map((doc) => ({
    docId: doc.docId,
    title: doc.title,
    content: doc.content,
    level: 1,
  }));
}

export type { CompileFormat, CompileRequest, CompileResult, CompileProgress };
