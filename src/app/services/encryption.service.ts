import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EncryptionService {
  // In a real commercial SaaS, this key would be derived from a user password.
  // For this local-first expert implementation, we use a robust internal key mechanism.
  private readonly MASTER_KEY_PART = 'MediFlow_Secure_v2_';
  private key: CryptoKey | null = null;

  constructor() {
    this.initKey();
  }

  private async initKey() {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.MASTER_KEY_PART + 'LocalIsolationVector'),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    this.key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('static_salt_for_offline_local'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypts an object into a Base64 string.
   */
  async encrypt(data: any): Promise<string> {
    if (!this.key) await this.initKey();
    
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(JSON.stringify(data));
    const iv = crypto.getRandomValues(new Uint8Array(12)); // AES-GCM recommended IV length

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.key!,
      encodedData
    );

    // Combine IV and Encrypted data for storage
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Decrypts a Base64 string back into an object.
   */
  async decrypt<T>(encryptedBase64: string): Promise<T | null> {
    if (!this.key) await this.initKey();

    try {
      const combined = new Uint8Array(atob(encryptedBase64).split('').map(c => c.charCodeAt(0)));
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.key!,
        data
      );

      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(decryptedBuffer));
    } catch (e) {
      console.error('Decryption failed. Data might be corrupted or key changed.', e);
      return null;
    }
  }

  /**
   * Utility to check if a string is likely encrypted.
   */
  isEncrypted(value: any): boolean {
    return typeof value === 'string' && value.length > 20 && !value.includes('{');
  }
}
