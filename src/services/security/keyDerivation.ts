/**
 * keyDerivation.ts — Faz 48: PBKDF2 / SHA-256 Anahtar Türetme ve Kriptografik Yardımcılar
 */

export function getSubtleCrypto(): SubtleCrypto {
  const cryptoObj = (typeof window !== 'undefined' ? window.crypto : undefined) || (typeof globalThis !== 'undefined' ? globalThis.crypto : undefined);
  if (!cryptoObj || !cryptoObj.subtle) {
    throw new Error('Web Crypto API (subtle) bu ortamda desteklenmiyor.');
  }
  return cryptoObj.subtle;
}

export function generateSalt(length = 16): Uint8Array {
  const cryptoObj = (typeof window !== 'undefined' ? window.crypto : undefined) || (typeof globalThis !== 'undefined' ? globalThis.crypto : undefined);
  const salt = new Uint8Array(length);
  if (cryptoObj && cryptoObj.getRandomValues) {
    cryptoObj.getRandomValues(salt);
  } else {
    for (let i = 0; i < length; i++) {
      salt[i] = Math.floor(Math.random() * 256);
    }
  }
  return salt;
}

export function generateIv(length = 12): Uint8Array {
  return generateSalt(length);
}

export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBuffer(hex: string): Uint8Array {
  const cleanHex = hex.trim();
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * PBKDF2 ile paroladan 256-bit AES-GCM anahtarı türetir.
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
  iterations = 100000
): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const baseKey = await subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return await subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );
}
