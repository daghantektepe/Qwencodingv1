/**
 * cryptoVault.ts — Faz 48: AES-256-GCM Şifreli Proje Kasası ve Otomatik Kilit Mimarisi
 */

import {
  getSubtleCrypto,
  generateSalt,
  generateIv,
  bufferToHex,
  hexToBuffer,
  deriveKeyFromPassword,
} from './keyDerivation';

export interface EncryptedEnvelope {
  version: number;
  algorithm: 'AES-GCM-256';
  saltHex: string;
  ivHex: string;
  iterations: number;
  ciphertextHex: string;
}

export class CryptoVaultService {
  private masterPasswordHash: string | null = null;
  private isLocked: boolean = false;
  private activePassword: string | null = null;
  private inactivityTimerId: any = null;

  /**
   * Metni AES-256-GCM ile şifreler ve kendi kendine yeten bir zarf (envelope) döner.
   */
  public async encryptProjectData(
    plainText: string,
    password: string
  ): Promise<EncryptedEnvelope> {
    const salt = generateSalt(16);
    const iv = generateIv(12);
    const iterations = 100000;

    const cryptoKey = await deriveKeyFromPassword(password, salt, iterations);
    const subtle = getSubtleCrypto();
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(plainText);

    const encryptedBuffer = await subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv as any,
      },
      cryptoKey,
      encodedData
    );

    return {
      version: 1,
      algorithm: 'AES-GCM-256',
      saltHex: bufferToHex(salt),
      ivHex: bufferToHex(iv),
      iterations,
      ciphertextHex: bufferToHex(encryptedBuffer),
    };
  }

  /**
   * Şifrelenmiş zarfı AES-256-GCM ile çözer. Yanlış parola veya bozuk veride hata fırlatır.
   */
  public async decryptProjectData(
    envelope: EncryptedEnvelope,
    password: string
  ): Promise<string> {
    if (envelope.algorithm !== 'AES-GCM-256') {
      throw new Error(`Desteklenmeyen şifreleme algoritması: ${envelope.algorithm}`);
    }

    const salt = hexToBuffer(envelope.saltHex);
    const iv = hexToBuffer(envelope.ivHex);
    const ciphertext = hexToBuffer(envelope.ciphertextHex);

    const cryptoKey = await deriveKeyFromPassword(
      password,
      salt,
      envelope.iterations || 100000
    );
    const subtle = getSubtleCrypto();

    const decryptedBuffer = await subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as any,
      },
      cryptoKey,
      ciphertext as any
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  }

  public setMasterPassword(password: string): void {
    this.masterPasswordHash = btoa(password);
    this.activePassword = password;
    this.isLocked = false;
  }

  public hasMasterPassword(): boolean {
    return this.masterPasswordHash !== null;
  }

  public isVaultLocked(): boolean {
    return this.isLocked;
  }

  public lockVault(): void {
    this.isLocked = true;
    this.activePassword = null;
  }

  public async unlockVault(password: string): Promise<boolean> {
    if (!this.masterPasswordHash) {
      // Parola henüz belirlenmemişse kilit açılır
      this.isLocked = false;
      return true;
    }

    if (btoa(password) === this.masterPasswordHash) {
      this.isLocked = false;
      this.activePassword = password;
      return true;
    }

    return false;
  }

  public getActivePassword(): string | null {
    return this.activePassword;
  }

  public resetVault(): void {
    this.masterPasswordHash = null;
    this.activePassword = null;
    this.isLocked = false;
    if (this.inactivityTimerId) {
      clearTimeout(this.inactivityTimerId);
      this.inactivityTimerId = null;
    }
  }

  /**
   * Belirtilen süre boyunca işlem yapılmazsa kasayı otomatik kilitler.
   */
  public setupInactivityTimer(
    timeoutMs: number,
    onLockCallback?: () => void
  ): () => void {
    const resetTimer = () => {
      if (this.inactivityTimerId) {
        clearTimeout(this.inactivityTimerId);
      }
      if (timeoutMs > 0 && this.hasMasterPassword() && !this.isLocked) {
        this.inactivityTimerId = setTimeout(() => {
          this.lockVault();
          if (onLockCallback) onLockCallback();
        }, timeoutMs);
      }
    };

    const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    const handleActivity = () => resetTimer();

    if (typeof window !== 'undefined') {
      activityEvents.forEach((event) =>
        window.addEventListener(event, handleActivity, { passive: true })
      );
    }

    resetTimer();

    return () => {
      if (this.inactivityTimerId) {
        clearTimeout(this.inactivityTimerId);
        this.inactivityTimerId = null;
      }
      if (typeof window !== 'undefined') {
        activityEvents.forEach((event) =>
          window.removeEventListener(event, handleActivity)
        );
      }
    };
  }
}

export const cryptoVault = new CryptoVaultService();
export default cryptoVault;
