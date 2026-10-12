/**
 * Compile Types - Derleme işlemleri için TypeScript arayüzleri ve tipleri
 */

/**
 * Desteklenen dışa aktarma formatları
 */
export type ExportFormat = 'pdf' | 'epub' | 'html' | 'md' | 'txt';

/**
 * Sayfa boyutları
 */
export type PageSize = 'a4' | 'letter' | 'a5';

/**
 * Sayfa yönü
 */
export type PageOrientation = 'portrait' | 'landscape';

/**
 * Belge düğümü - derlenecek her bir belgeyi temsil eder
 */
export interface DocumentNode {
  docId: string;
  title: string;
  content: string;
  level?: number;
  folder?: string;
}

/**
 * Derleme seçenekleri
 */
export interface CompileOptions {
  /** Derleme formatı */
  format: ExportFormat;
  
  /** Kitap başlığı */
  title: string;
  
  /** Yazar adı (opsiyonel) */
  author?: string;
  
  /** Başlık sayfası dahil edilsin mi */
  includeTitlePage?: boolean;
  
  /** İçindekiler tablosu dahil edilsin mi */
  includeTOC?: boolean;
  
  /** Özel CSS şablonu (opsiyonel) */
  cssTemplate?: string;
  
  /** PDF için sayfa boyutu */
  pageSize?: PageSize;
  
  /** PDF için sayfa yönü */
  orientation?: PageOrientation;
  
  /** PDF için kenar boşlukları (mm cinsinden) */
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  
  /** PDF için yazı tipi boyutu */
  fontSize?: number;
  
  /** PDF için yazı tipi ailesi */
  fontFamily?: string;
  
  /** EPUB için dil kodu (örn: 'tr', 'en') */
  language?: string;
  
  /** EPUB için yayıncı adı */
  publisher?: string;
  
  /** EPUB için açıklama */
  description?: string;
  
  /** EPUB için konular */
  subjects?: string[];
  
  /** EPUB için telif hakkı bilgisi */
  rights?: string;
}

/**
 * Derleme isteği - kullanıcıdan alınan tüm parametreler
 */
export interface CompileRequest {
  /** Derlenecek belgeler */
  documents: DocumentNode[];
  
  /** Derleme formatı */
  format: ExportFormat;
  
  /** Kitap başlığı */
  title: string;
  
  /** Yazar adı (opsiyonel) */
  author?: string;
  
  /** Başlık sayfası dahil edilsin mi */
  includeTitlePage?: boolean;
  
  /** İçindekiler tablosu dahil edilsin mi */
  includeTOC?: boolean;
  
  /** Özel CSS şablonu (opsiyonel) */
  cssTemplate?: string;
  
  /** PDF için sayfa boyutu */
  pageSize?: PageSize;
  
  /** PDF için sayfa yönü */
  orientation?: PageOrientation;
  
  /** EPUB için dil kodu */
  language?: string;
  
  /** EPUB için yayıncı adı */
  publisher?: string;
  
  /** EPUB için açıklama */
  description?: string;
}

/**
 * Derleme sonucu
 */
export interface CompileResult {
  /** İşlem başarılı mı */
  success: boolean;
  
  /** Oluşturulan dosya blob'u */
  blob?: Blob;
  
  /** Dosya adı */
  filename?: string;
  
  /** Hata mesajı (başarısız durumda) */
  error?: string;
  
  /** Kullanılan format */
  format: ExportFormat;
  
  /** İşlem süresi (milisaniye) */
  duration?: number;
}

/**
 * Derleme ilerleme durumu
 */
export interface CompileProgress {
  /** Mevcut aşama açıklaması */
  stage: string;
  
  /** İlerleme yüzdesi (0-100) */
  percent: number;
  
  /** İşlenen belge sayısı (opsiyonel) */
  currentDoc?: number;
  
  /** Toplam belge sayısı (opsiyonel) */
  totalDocs?: number;
}

/**
 * İlerleme callback fonksiyonu tipi
 */
export type ProgressCallback = (progress: CompileProgress) => void;

/**
 * Format bilgisi - UI'da format seçiminde kullanılır
 */
export interface FormatInfo {
  /** Format değeri */
  value: ExportFormat;
  
  /** Görüntülenecek etiket */
  label: string;
  
  /** MIME tipi */
  mime: string;
  
  /** İkon (emoji) */
  icon: string;
}

/**
 * Derleme ayarları - localStorage'da saklanır
 */
export interface CompileSettings {
  /** Son kullanılan format */
  format?: ExportFormat;
  
  /** Son kullanılan başlık */
  title?: string;
  
  /** Son kullanılan yazar */
  author?: string;
  
  /** Başlık sayfası dahil mi */
  includeTitlePage?: boolean;
  
  /** İçindekiler dahil mi */
  includeTOC?: boolean;
  
  /** PDF sayfa boyutu */
  pageSize?: PageSize;
  
  /** PDF sayfa yönü */
  orientation?: PageOrientation;
  
  /** EPUB dili */
  language?: string;
  
  /** EPUB yayıncısı */
  publisher?: string;
}

/**
 * Derleme motoru arayüzü
 */
export interface ICompileEngine {
  /**
   * Belgeleri derler
   * @param request - Derleme isteği
   * @param onProgress - İlerleme callback'i
   * @returns Derleme sonucu
   */
  compile(request: CompileRequest, onProgress?: ProgressCallback): Promise<CompileResult>;
  
  /**
   * Derleme sonucunu dosya olarak indirir
   * @param result - Derleme sonucu
   */
  download(result: CompileResult): void;
  
  /**
   * Desteklenen formatları döndürür
   */
  getSupportedFormats(): FormatInfo[];
  
  /**
   * Ayarları kaydeder
   * @param settings - Kaydedilecek ayarlar
   */
  saveSettings(settings: Partial<CompileSettings>): void;
  
  /**
   * Kaydedilmiş ayarları yükler
   */
  loadSettings(): Partial<CompileSettings>;
}

/**
 * Varsayılan derleme seçenekleri
 */
export const DEFAULT_COMPILE_OPTIONS: Partial<CompileOptions> = {
  format: 'pdf',
  includeTitlePage: true,
  includeTOC: true,
  pageSize: 'a4',
  orientation: 'portrait',
  language: 'tr',
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },
  fontSize: 12,
  fontFamily: 'times',
};

/**
 * Desteklenen formatlar listesi
 */
export const SUPPORTED_FORMATS: FormatInfo[] = [
  { value: 'pdf', label: 'PDF Belgesi', mime: 'application/pdf', icon: '📄' },
  { value: 'epub', label: 'EPUB (e-Kitap)', mime: 'application/epub+zip', icon: '📚' },
  { value: 'html', label: 'HTML Web Sayfası', mime: 'text/html', icon: '🌐' },
  { value: 'md', label: 'Markdown (.md)', mime: 'text/markdown', icon: '📝' },
  { value: 'txt', label: 'Düz Metin (.txt)', mime: 'text/plain', icon: '📃' },
];
