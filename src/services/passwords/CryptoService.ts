/**
 * CryptoService
 *
 * New format (version 2): PBKDF2-SHA256 + XSalsa20-Poly1305 (tweetnacl secretbox).
 * Legacy format is still supported for password verification and decryption to avoid
 * breaking existing vault data.
 */

import 'react-native-get-random-values';
import nacl from 'tweetnacl';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 as nobleSha256 } from '@noble/hashes/sha2.js';

const DEFAULT_CONFIG = {
  pbkdf2Iterations: 12000,
  pbkdf2AsyncTick: 25,
  keyLength: 64,
  saltLength: 32,
  nonceLength: 24,
};

const LEGACY_KDF_ITERATIONS = 10000;
const V2_PREFIX = 'v2:';

export interface DerivedKey {
  encryptionKey: Uint8Array;
  hmacKey: Uint8Array;
  salt: string;
}

export interface DoubleEncryptedResult {
  version?: number;
  algorithm?: string;
  kdf?: string;
  nonce?: string;
  ciphertext?: string;
  aesCiphertext?: string;
  aesIv?: string;
  aesAuthTag?: string;
  chachaCiphertext?: string;
  chachaNonce?: string;
  chachaTag?: string;
  hmac?: string;
}

export async function generateRandomBytes(length: number): Promise<Uint8Array> {
  return nacl.randomBytes(length);
}

export async function generateRandomBase64(length: number): Promise<string> {
  const bytes = await generateRandomBytes(length);
  return bytesToBase64(bytes);
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

export function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

export async function sha256(data: string | Uint8Array): Promise<string> {
  const input = typeof data === 'string' ? stringToBytes(data) : data;
  const digest = nobleSha256(input);
  return bytesToBase64(digest);
}

export async function verifyHash(data: string, expectedHash: string): Promise<boolean> {
  const actualHash = await sha256(data);
  return actualHash === expectedHash;
}

export async function generateSalt(): Promise<Uint8Array> {
  return generateRandomBytes(DEFAULT_CONFIG.saltLength);
}

async function deriveKeyV2(password: string, salt: Uint8Array, keyLength = DEFAULT_CONFIG.keyLength): Promise<Uint8Array> {
  return pbkdf2Async(nobleSha256, stringToBytes(password), salt, {
    c: DEFAULT_CONFIG.pbkdf2Iterations,
    dkLen: keyLength,
    asyncTick: DEFAULT_CONFIG.pbkdf2AsyncTick,
  });
}

async function deriveKeyLegacy(
  password: string,
  salt: Uint8Array,
  iterations: number = LEGACY_KDF_ITERATIONS,
  keyLength: number = DEFAULT_CONFIG.keyLength
): Promise<Uint8Array> {
  let key = stringToBytes(password);
  const saltInfo = bytesToBase64(salt);

  for (let i = 0; i < iterations; i++) {
    const toHash = bytesToString(key) + saltInfo + i.toString();
    const hash = await sha256(toHash);
    key = base64ToBytes(hash);
  }

  if (key.length >= keyLength) return key.slice(0, keyLength);

  const padded = new Uint8Array(keyLength);
  padded.set(key, 0);
  return padded;
}

export async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number = DEFAULT_CONFIG.pbkdf2Iterations,
  keyLength: number = DEFAULT_CONFIG.keyLength
): Promise<DerivedKey> {
  const derived = await pbkdf2Async(nobleSha256, stringToBytes(password), salt, {
    c: iterations,
    dkLen: keyLength,
    asyncTick: DEFAULT_CONFIG.pbkdf2AsyncTick,
  });

  return {
    encryptionKey: derived.slice(0, 32),
    hmacKey: derived.slice(32, 64),
    salt: bytesToBase64(salt),
  };
}

async function createVerificationHashV2(encryptionKey: Uint8Array): Promise<string> {
  const data = bytesToString(encryptionKey) + 'verification';
  return sha256(data);
}

async function createVerificationHashLegacy(encryptionKey: Uint8Array): Promise<string> {
  const data = bytesToString(encryptionKey) + 'verification';
  return sha256(data);
}

export async function createVerificationHash(encryptionKey: Uint8Array): Promise<string> {
  return createVerificationHashV2(encryptionKey);
}

export async function doubleEncrypt(plaintext: string, key: Uint8Array): Promise<DoubleEncryptedResult> {
  if (key.length < 32) {
    throw new Error('Invalid encryption key');
  }

  const nonce = nacl.randomBytes(DEFAULT_CONFIG.nonceLength);
  const message = stringToBytes(plaintext);
  const ciphertext = nacl.secretbox(message, nonce, key.slice(0, 32));

  return {
    version: 2,
    algorithm: 'xsalsa20-poly1305',
    kdf: 'pbkdf2-sha256',
    nonce: bytesToBase64(nonce),
    ciphertext: bytesToBase64(ciphertext),
  };
}

async function legacyStretchKey(key: Uint8Array, length: number): Promise<Uint8Array> {
  const result = new Uint8Array(length);
  let counter = 0;
  let offset = 0;

  while (offset < length) {
    const data = bytesToString(key) + counter.toString();
    const hash = await sha256(data);
    const hashBytes = base64ToBytes(hash);
    const copyLength = Math.min(hashBytes.length, length - offset);
    result.set(hashBytes.slice(0, copyLength), offset);
    offset += copyLength;
    counter++;
  }

  return result;
}

async function legacyStretchKeyChaCha(key: Uint8Array, nonce: Uint8Array, length: number): Promise<Uint8Array> {
  const result = new Uint8Array(length);
  let counter = 0;
  let offset = 0;

  while (offset < length) {
    const data = bytesToString(key) + bytesToString(nonce) + counter.toString();
    const hash = await sha256(data);
    const hashBytes = base64ToBytes(hash);
    const copyLength = Math.min(hashBytes.length, length - offset);
    result.set(hashBytes.slice(0, copyLength), offset);
    offset += copyLength;
    counter++;
  }

  return result;
}

async function legacyDoubleDecrypt(data: DoubleEncryptedResult, key: Uint8Array): Promise<string> {
  if (!data.aesCiphertext || !data.aesIv || !data.aesAuthTag || !data.chachaCiphertext || !data.chachaNonce || !data.chachaTag || !data.hmac) {
    throw new Error('Invalid legacy encrypted payload');
  }

  const hmacData =
    data.aesCiphertext +
    data.aesIv +
    data.aesAuthTag +
    data.chachaCiphertext +
    data.chachaNonce +
    data.chachaTag;
  const expectedHmac = await sha256(hmacData + bytesToString(key));
  if (data.hmac !== expectedHmac.substring(0, 32)) {
    throw new Error('HMAC verification failed - data may be tampered');
  }

  const tagData = data.chachaNonce + data.chachaCiphertext + bytesToString(key);
  const expectedTag = await sha256(tagData);
  if (data.chachaTag !== expectedTag.substring(0, 32)) {
    throw new Error('ChaCha20 authentication failed');
  }

  const ciphertextBytes = base64ToBytes(data.chachaCiphertext);
  const nonceBytes = base64ToBytes(data.chachaNonce);
  const keyExtended = await legacyStretchKeyChaCha(key, nonceBytes, ciphertextBytes.length);

  const aesCombined = new Uint8Array(ciphertextBytes.length);
  for (let i = 0; i < ciphertextBytes.length; i++) {
    aesCombined[i] = ciphertextBytes[i] ^ keyExtended[i % keyExtended.length];
  }

  const authData = data.aesIv + data.aesCiphertext;
  const expectedAesTag = await sha256(authData + bytesToString(key));
  if (data.aesAuthTag !== expectedAesTag.substring(0, 32)) {
    throw new Error('Authentication failed - data may be tampered');
  }

  const aesCiphertextBytes = base64ToBytes(data.aesCiphertext);
  const aesKeyExtended = await legacyStretchKey(key, aesCiphertextBytes.length);

  const plaintext = new Uint8Array(aesCiphertextBytes.length);
  for (let i = 0; i < aesCiphertextBytes.length; i++) {
    plaintext[i] = aesCiphertextBytes[i] ^ aesKeyExtended[i % aesKeyExtended.length];
  }

  return bytesToString(plaintext);
}

export async function doubleDecrypt(data: DoubleEncryptedResult, key: Uint8Array): Promise<string> {
  if (data.version === 2 && data.nonce && data.ciphertext) {
    const nonce = base64ToBytes(data.nonce);
    const ciphertext = base64ToBytes(data.ciphertext);
    const opened = nacl.secretbox.open(ciphertext, nonce, key.slice(0, 32));
    if (!opened) {
      throw new Error('Failed to decrypt data');
    }
    return bytesToString(opened);
  }

  return legacyDoubleDecrypt(data, key);
}

export class CryptoService {
  async createVault(password: string): Promise<{ salt: string; verificationHash: string }> {
    const salt = await generateSalt();
    const derived = await deriveKeyV2(password, salt, DEFAULT_CONFIG.keyLength);
    const verificationHash = await createVerificationHashV2(derived.slice(0, 32));

    return {
      salt: bytesToBase64(salt),
      verificationHash: `${V2_PREFIX}${verificationHash}`,
    };
  }

  async unlockVault(password: string, salt: string, verificationHash?: string): Promise<Uint8Array> {
    const saltBytes = base64ToBytes(salt);

    if (verificationHash?.startsWith(V2_PREFIX)) {
      const derived = await deriveKeyV2(password, saltBytes, DEFAULT_CONFIG.keyLength);
      const hash = await createVerificationHashV2(derived.slice(0, 32));
      if (`${V2_PREFIX}${hash}` !== verificationHash) {
        throw new Error('Invalid vault password');
      }
      return derived.slice(0, 32);
    }

    if (verificationHash) {
      const legacy = await deriveKeyLegacy(password, saltBytes, LEGACY_KDF_ITERATIONS, DEFAULT_CONFIG.keyLength);
      const legacyHash = await createVerificationHashLegacy(legacy.slice(0, 32));
      if (legacyHash === verificationHash) {
        return legacy.slice(0, 32);
      }

      // If verification hash exists but legacy check failed, treat as invalid.
      throw new Error('Invalid vault password');
    }

    const derived = await deriveKeyV2(password, saltBytes, DEFAULT_CONFIG.keyLength);
    return derived.slice(0, 32);
  }

  async verifyPassword(password: string, salt: string, verificationHash: string): Promise<boolean> {
    const saltBytes = base64ToBytes(salt);

    if (verificationHash.startsWith(V2_PREFIX)) {
      const derived = await deriveKeyV2(password, saltBytes, DEFAULT_CONFIG.keyLength);
      const hash = await createVerificationHashV2(derived.slice(0, 32));
      return `${V2_PREFIX}${hash}` === verificationHash;
    }

    const legacyDerived = await deriveKeyLegacy(password, saltBytes, LEGACY_KDF_ITERATIONS, DEFAULT_CONFIG.keyLength);
    const legacyHash = await createVerificationHashLegacy(legacyDerived.slice(0, 32));
    if (legacyHash === verificationHash) {
      return true;
    }

    const v2Derived = await deriveKeyV2(password, saltBytes, DEFAULT_CONFIG.keyLength);
    const v2Hash = await createVerificationHashV2(v2Derived.slice(0, 32));
    return `${V2_PREFIX}${v2Hash}` === verificationHash;
  }

  async encrypt(data: string, key: Uint8Array): Promise<DoubleEncryptedResult> {
    return doubleEncrypt(data, key);
  }

  async decrypt(encryptedData: DoubleEncryptedResult, key: Uint8Array): Promise<string> {
    return doubleDecrypt(encryptedData, key);
  }

  async generatePassword(options: {
    length: number;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    symbols: boolean;
  }): Promise<string> {
    const { length, uppercase, lowercase, numbers, symbols } = options;

    let chars = '';
    const required: string[] = [];

    if (uppercase) {
      chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      required.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    }
    if (lowercase) {
      chars += 'abcdefghijklmnopqrstuvwxyz';
      required.push('abcdefghijklmnopqrstuvwxyz');
    }
    if (numbers) {
      chars += '0123456789';
      required.push('0123456789');
    }
    if (symbols) {
      chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
      required.push('!@#$%^&*()_+-=[]{}|;:,.<>?');
    }

    if (!chars) {
      chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    }

    const randomBytes = await generateRandomBytes(length + required.length + 4);
    let password = '';

    for (let i = 0; i < length; i++) {
      password += chars[randomBytes[i] % chars.length];
    }

    if (required.length > 0 && password.length >= required.length) {
      const passwordChars = password.split('');
      for (let i = 0; i < required.length; i++) {
        const idxSeed = randomBytes[length + i] ?? randomBytes[0];
        const charSeed = randomBytes[length + required.length + i] ?? randomBytes[1];
        const randomIndex = idxSeed % passwordChars.length;
        passwordChars[randomIndex] = required[i][charSeed % required[i].length];
      }
      password = passwordChars.join('');
    }

    return password;
  }

  calculatePasswordStrength(password: string): number {
    let score = 0;

    if (password.length >= 8) score += 10;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 15;
    if (password.length >= 20) score += 20;
    if (password.length >= 30) score += 25;

    if (/[a-z]/.test(password)) score += 5;
    if (/[A-Z]/.test(password)) score += 5;
    if (/[0-9]/.test(password)) score += 5;
    if (/[^a-zA-Z0-9]/.test(password)) score += 10;

    return Math.min(score, 100);
  }
}

export const cryptoService = new CryptoService();
export default cryptoService;
