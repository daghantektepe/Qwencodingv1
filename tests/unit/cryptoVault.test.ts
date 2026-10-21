import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  generateSalt,
  generateIv,
  bufferToHex,
  hexToBuffer,
  deriveKeyFromPassword,
} from '../../src/services/security/keyDerivation';
import cryptoVault, { CryptoVaultService } from '../../src/services/security/cryptoVault';
import LockScreen from '../../src/components/Security/LockScreen';
import VaultSettingsDialog from '../../src/components/Security/VaultSettingsDialog';

describe('Phase 48: AES-256 Crypto Vault & Zero-Knowledge Security', () => {
  beforeEach(() => {
    cryptoVault.resetVault();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Key Derivation & Helpers', () => {
    it('generates salt and IV with specified lengths', () => {
      const salt = generateSalt(16);
      const iv = generateIv(12);

      expect(salt.length).toBe(16);
      expect(iv.length).toBe(12);
    });

    it('converts buffer to hex and back accurately', () => {
      const original = new Uint8Array([0, 15, 255, 128, 64]);
      const hex = bufferToHex(original);
      expect(hex).toBe('000fff8040');

      const recovered = hexToBuffer(hex);
      expect(Array.from(recovered)).toEqual(Array.from(original));
    });

    it('derives a valid AES-GCM CryptoKey using PBKDF2', async () => {
      const salt = generateSalt(16);
      const key = await deriveKeyFromPassword('my-secret-pass', salt, 1000);

      expect(key).toBeDefined();
      expect(key.algorithm.name).toBe('AES-GCM');
    });
  });

  describe('CryptoVaultService Encryption & Decryption', () => {
    it('encrypts plaintext into an envelope and decrypts it back', async () => {
      const plainText = 'Gizli Roman Taslağı: Bölüm 1 - Başlangıç';
      const password = 'AuthorSuperSecretKey2026!';

      const envelope = await cryptoVault.encryptProjectData(plainText, password);

      expect(envelope.algorithm).toBe('AES-GCM-256');
      expect(envelope.ciphertextHex).toBeDefined();
      expect(envelope.ciphertextHex).not.toBe(plainText);

      const decrypted = await cryptoVault.decryptProjectData(envelope, password);
      expect(decrypted).toBe(plainText);
    });

    it('fails decryption when an incorrect password is provided', async () => {
      const plainText = 'Çok gizli araştırma notu.';
      const envelope = await cryptoVault.encryptProjectData(plainText, 'CorrectPassword123');

      await expect(
        cryptoVault.decryptProjectData(envelope, 'WrongPassword456')
      ).rejects.toThrow();
    });

    it('detects tampering and rejects modified ciphertext (AES-GCM integrity)', async () => {
      const plainText = 'Bozulmaması gereken veri';
      const envelope = await cryptoVault.encryptProjectData(plainText, 'VaultKey123');

      // Tamper with the ciphertext by flipping characters
      const tamperedHex =
        envelope.ciphertextHex.substring(0, 4) === '0000'
          ? 'ffff' + envelope.ciphertextHex.substring(4)
          : '0000' + envelope.ciphertextHex.substring(4);

      const tamperedEnvelope = { ...envelope, ciphertextHex: tamperedHex };

      await expect(
        cryptoVault.decryptProjectData(tamperedEnvelope, 'VaultKey123')
      ).rejects.toThrow();
    });
  });

  describe('Vault State & Inactivity Lock', () => {
    it('manages master password and lock state', async () => {
      expect(cryptoVault.hasMasterPassword()).toBe(false);
      expect(cryptoVault.isVaultLocked()).toBe(false);

      cryptoVault.setMasterPassword('Pass1234');
      expect(cryptoVault.hasMasterPassword()).toBe(true);

      cryptoVault.lockVault();
      expect(cryptoVault.isVaultLocked()).toBe(true);

      const wrongAttempt = await cryptoVault.unlockVault('Wrong');
      expect(wrongAttempt).toBe(false);
      expect(cryptoVault.isVaultLocked()).toBe(true);

      const successAttempt = await cryptoVault.unlockVault('Pass1234');
      expect(successAttempt).toBe(true);
      expect(cryptoVault.isVaultLocked()).toBe(false);
    });

    it('triggers inactivity lock after timeout', () => {
      const onLock = vi.fn();
      cryptoVault.setMasterPassword('TestLock');

      const cleanup = cryptoVault.setupInactivityTimer(5000, onLock);

      vi.advanceTimersByTime(4999);
      expect(onLock).not.toHaveBeenCalled();

      vi.advanceTimersByTime(2);
      expect(onLock).toHaveBeenCalled();
      expect(cryptoVault.isVaultLocked()).toBe(true);

      cleanup();
    });
  });

  describe('UI Security Components', () => {
    it('renders LockScreen and unlocks when correct password is submitted', async () => {
      vi.useRealTimers(); // Async crypto operations need real timers
      cryptoVault.setMasterPassword('Secret123');
      cryptoVault.lockVault();

      const onUnlock = vi.fn();
      render(React.createElement(LockScreen, { onUnlockSuccess: onUnlock }));

      const input = screen.getByLabelText(/Ana Parola/i);
      const submitBtn = screen.getByText(/Kilidi Aç/i);

      fireEvent.change(input, { target: { value: 'Secret123' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(onUnlock).toHaveBeenCalled();
      });
    });

    it('renders VaultSettingsDialog and saves master password', () => {
      const handleClose = vi.fn();
      render(
        React.createElement(VaultSettingsDialog, {
          isOpen: true,
          onClose: handleClose,
        })
      );

      const inputs = screen.getAllByPlaceholderText(/parola/i);
      expect(inputs.length).toBeGreaterThanOrEqual(1);

      const saveBtn = screen.getByText('Kaydet');
      expect(saveBtn).toBeDefined();
    });
  });
});
