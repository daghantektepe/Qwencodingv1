/**
 * Native Clipboard Bridge
 * Phase 114: Yerel Pano (Clipboard) ve Zengin Medya Köprüsü
 */

export interface ClipboardRichResult {
  type: 'image' | 'html' | 'text';
  content?: string;
  assetPath?: string;
  fileName?: string;
  error?: string;
}

export function cleanExternalHtmlText(rawHtml: string): string {
  if (!rawHtml) return '';
  return rawHtml
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<o:p>[\s\S]*?<\/o:p>/gi, '')
    .replace(/mso-[a-zA-Z-]+:[^;"]+;?/gi, '')
    .replace(/class="Mso[a-zA-Z]+"/gi, '')
    .replace(/<span\s*>(.*?)<\/span>/gi, '$1')
    .trim();
}

export class ClipboardBridge {
  static isElectron(): boolean {
    return typeof window !== 'undefined' && !!(window as any).electronBridge?.isDesktop;
  }

  static async readRichClipboard(packagePath?: string): Promise<ClipboardRichResult> {
    if (this.isElectron()) {
      try {
        const res = await (window as any).electronBridge.invoke('clipboard:read-rich', { packagePath });
        return res || { type: 'text', content: '' };
      } catch (err: any) {
        return { type: 'text', content: '', error: err.message };
      }
    }

    // Web fallback
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        return { type: 'text', content: text };
      }
    } catch {
      // Pano okuma izni verilmemiş olabilir
    }

    return { type: 'text', content: '' };
  }

  static async copyText(text: string): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  static processPastedHtml(html: string): string {
    return cleanExternalHtmlText(html);
  }
}
