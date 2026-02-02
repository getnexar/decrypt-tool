/**
 * Tests for Nexar Video Decryption Library
 */

import { describe, it, expect } from 'vitest';
import { generateXorPad, decryptChunk, validateMp4Header } from './crypto';

describe('generateXorPad', () => {
  it('should generate 4096-byte pad', () => {
    const pad = generateXorPad('f626ad1ffb5159bef3e9295df34244af');
    expect(pad.length).toBe(4096);
  });

  it('should generate deterministic pad from same key', () => {
    const key = 'f626ad1ffb5159bef3e9295df34244af';
    const pad1 = generateXorPad(key);
    const pad2 = generateXorPad(key);

    expect(pad1).toEqual(pad2);
  });

  it('should generate different pads for different keys', () => {
    const pad1 = generateXorPad('f626ad1ffb5159bef3e9295df34244af');
    const pad2 = generateXorPad('0000000000000000000000000000000000');

    expect(pad1).not.toEqual(pad2);
  });

  it('should handle lowercase hex keys', () => {
    const padLower = generateXorPad('f626ad1ffb5159bef3e9295df34244af');
    const padUpper = generateXorPad('F626AD1FFB5159BEF3E9295DF34244AF');

    expect(padLower).toEqual(padUpper);
  });

  it('should generate valid byte values (0-255)', () => {
    const pad = generateXorPad('f626ad1ffb5159bef3e9295df34244af');

    for (let i = 0; i < pad.length; i++) {
      expect(pad[i]).toBeGreaterThanOrEqual(0);
      expect(pad[i]).toBeLessThanOrEqual(255);
    }
  });

  it('should produce non-zero pad (not all zeros)', () => {
    const pad = generateXorPad('f626ad1ffb5159bef3e9295df34244af');
    const sum = Array.from(pad).reduce((acc, val) => acc + val, 0);

    // Extremely unlikely for LCG to produce all zeros
    expect(sum).toBeGreaterThan(0);
  });
});

describe('decryptChunk', () => {
  const testKey = 'f626ad1ffb5159bef3e9295df34244af';
  let testPad: Uint8Array;

  beforeEach(() => {
    testPad = generateXorPad(testKey);
  });

  it('should decrypt data with XOR operation', () => {
    const plaintext = new Uint8Array([1, 2, 3, 4, 5]);
    const encrypted = new Uint8Array(plaintext.length);

    // Encrypt by XORing with pad
    for (let i = 0; i < plaintext.length; i++) {
      encrypted[i] = plaintext[i] ^ testPad[i];
    }

    // Decrypt should recover original
    const decrypted = decryptChunk(encrypted, testPad, 0);
    expect(decrypted).toEqual(plaintext);
  });

  it('should be reversible (encrypt then decrypt)', () => {
    const original = new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80]);

    // Encrypt (XOR with pad)
    const encrypted = decryptChunk(original, testPad, 0);

    // Decrypt (XOR again with same pad)
    const decrypted = decryptChunk(encrypted, testPad, 0);

    expect(decrypted).toEqual(original);
  });

  it('should handle offset for pad cycling', () => {
    const chunk1 = new Uint8Array(100);
    const chunk2 = new Uint8Array(100);

    // Fill with test data
    for (let i = 0; i < 100; i++) {
      chunk1[i] = i;
      chunk2[i] = i + 100;
    }

    // Decrypt both chunks
    const decrypted1 = decryptChunk(chunk1, testPad, 0);
    const decrypted2 = decryptChunk(chunk2, testPad, 100);

    // Re-encrypt to verify offset works correctly
    const reencrypted1 = decryptChunk(decrypted1, testPad, 0);
    const reencrypted2 = decryptChunk(decrypted2, testPad, 100);

    expect(reencrypted1).toEqual(chunk1);
    expect(reencrypted2).toEqual(chunk2);
  });

  it('should cycle pad correctly at 4096-byte boundary', () => {
    const data = new Uint8Array([42]);

    // Decrypt at position 0
    const decrypted1 = decryptChunk(data, testPad, 0);

    // Decrypt at position 4096 (should use same pad byte due to cycling)
    const decrypted2 = decryptChunk(data, testPad, 4096);

    expect(decrypted1).toEqual(decrypted2);
  });

  it('should handle large chunks efficiently', () => {
    const largeChunk = new Uint8Array(1024 * 1024); // 1MB
    for (let i = 0; i < largeChunk.length; i++) {
      largeChunk[i] = i % 256;
    }

    const start = performance.now();
    const decrypted = decryptChunk(largeChunk, testPad, 0);
    const duration = performance.now() - start;

    expect(decrypted.length).toBe(largeChunk.length);
    expect(duration).toBeLessThan(100); // Should decrypt 1MB in <100ms
  });

  it('should handle empty data', () => {
    const empty = new Uint8Array(0);
    const decrypted = decryptChunk(empty, testPad, 0);

    expect(decrypted.length).toBe(0);
  });

  it('should work with different offset positions', () => {
    const data = new Uint8Array([100, 101, 102, 103, 104]);

    const decrypted1 = decryptChunk(data, testPad, 0);
    const decrypted2 = decryptChunk(data, testPad, 1000);
    const decrypted3 = decryptChunk(data, testPad, 5000);

    // Different offsets should produce different results
    expect(decrypted1).not.toEqual(decrypted2);
    expect(decrypted2).not.toEqual(decrypted3);
  });
});

describe('validateMp4Header', () => {
  it('should validate valid ftyp header', () => {
    const header = new Uint8Array([
      0x00, 0x00, 0x00, 0x18, // box size = 24 bytes
      0x66, 0x74, 0x79, 0x70, // "ftyp"
      0x69, 0x73, 0x6f, 0x6d, // brand: "isom"
    ]);

    expect(validateMp4Header(header)).toBe(true);
  });

  it('should validate ftyp with size 20', () => {
    const header = new Uint8Array([
      0x00, 0x00, 0x00, 0x14, // box size = 20 bytes
      0x66, 0x74, 0x79, 0x70, // "ftyp"
      0x6d, 0x70, 0x34, 0x32, // brand: "mp42"
    ]);

    expect(validateMp4Header(header)).toBe(true);
  });

  it('should reject header with invalid box type', () => {
    const header = new Uint8Array([
      0x00, 0x00, 0x00, 0x18,
      0x78, 0x78, 0x78, 0x78, // "xxxx" - invalid type
      0x00, 0x00, 0x00, 0x00,
    ]);

    expect(validateMp4Header(header)).toBe(false);
  });

  it('should reject header with invalid box size (too small)', () => {
    const header = new Uint8Array([
      0x00, 0x00, 0x00, 0x04, // box size = 4 (too small)
      0x66, 0x74, 0x79, 0x70,
      0x00, 0x00, 0x00, 0x00,
    ]);

    expect(validateMp4Header(header)).toBe(false);
  });

  it('should reject header with invalid box size (too large)', () => {
    const header = new Uint8Array([
      0x00, 0x00, 0x04, 0x01, // box size = 1025 (too large)
      0x66, 0x74, 0x79, 0x70,
      0x00, 0x00, 0x00, 0x00,
    ]);

    expect(validateMp4Header(header)).toBe(false);
  });

  it('should reject header that is too short', () => {
    const shortHeader = new Uint8Array([0x00, 0x00, 0x00, 0x18]);
    expect(validateMp4Header(shortHeader)).toBe(false);
  });

  it('should accept all valid MP4 box types', () => {
    const validTypes = ['ftyp', 'iso2', 'isom', 'mp41', 'mp42'];

    for (const type of validTypes) {
      const header = new Uint8Array(12);
      header[0] = 0x00;
      header[1] = 0x00;
      header[2] = 0x00;
      header[3] = 0x18; // size = 24

      // Write type as ASCII
      for (let i = 0; i < 4; i++) {
        header[4 + i] = type.charCodeAt(i);
      }

      expect(validateMp4Header(header)).toBe(true);
    }
  });

  it('should reject non-ASCII characters in box type', () => {
    const header = new Uint8Array([
      0x00, 0x00, 0x00, 0x18,
      0xFF, 0xFE, 0xFD, 0xFC, // invalid non-ASCII
      0x00, 0x00, 0x00, 0x00,
    ]);

    expect(validateMp4Header(header)).toBe(false);
  });

  it('should handle exact minimum size (8 bytes)', () => {
    const header = new Uint8Array([
      0x00, 0x00, 0x00, 0x08, // box size = 8 (minimum valid)
      0x66, 0x74, 0x79, 0x70,
      0x00, 0x00, 0x00, 0x00,
    ]);

    expect(validateMp4Header(header)).toBe(true);
  });

  it('should handle exact maximum size (1024 bytes)', () => {
    const header = new Uint8Array([
      0x00, 0x00, 0x04, 0x00, // box size = 1024
      0x66, 0x74, 0x79, 0x70,
      0x00, 0x00, 0x00, 0x00,
    ]);

    expect(validateMp4Header(header)).toBe(true);
  });
});

describe('integration: full encryption/decryption flow', () => {
  it('should decrypt realistic MP4 header', () => {
    const key = 'f626ad1ffb5159bef3e9295df34244af';
    const pad = generateXorPad(key);

    // Create a realistic MP4 header
    const realHeader = new Uint8Array([
      0x00, 0x00, 0x00, 0x20, // box size = 32
      0x66, 0x74, 0x79, 0x70, // "ftyp"
      0x69, 0x73, 0x6f, 0x6d, // major brand: "isom"
      0x00, 0x00, 0x02, 0x00, // minor version
      0x69, 0x73, 0x6f, 0x6d, // compatible brand 1
      0x69, 0x73, 0x6f, 0x32, // compatible brand 2
      0x61, 0x76, 0x63, 0x31, // compatible brand 3
      0x6d, 0x70, 0x34, 0x31, // compatible brand 4
    ]);

    // Encrypt the header
    const encrypted = decryptChunk(realHeader, pad, 0);

    // Decrypt it back
    const decrypted = decryptChunk(encrypted, pad, 0);

    // Should match original
    expect(decrypted).toEqual(realHeader);

    // Decrypted header should validate
    expect(validateMp4Header(decrypted)).toBe(true);
  });

  it('should detect wrong key by failed validation', () => {
    const correctKey = 'f626ad1ffb5159bef3e9295df34244af';
    const wrongKey = '0000000000000000000000000000000000';

    const correctPad = generateXorPad(correctKey);
    const wrongPad = generateXorPad(wrongKey);

    // Create valid MP4 header
    const header = new Uint8Array([
      0x00, 0x00, 0x00, 0x18,
      0x66, 0x74, 0x79, 0x70,
      0x69, 0x73, 0x6f, 0x6d,
    ]);

    // Encrypt with correct key
    const encrypted = decryptChunk(header, correctPad, 0);

    // Try to decrypt with wrong key
    const decryptedWrong = decryptChunk(encrypted, wrongPad, 0);

    // Should NOT validate
    expect(validateMp4Header(decryptedWrong)).toBe(false);

    // Decrypt with correct key
    const decryptedCorrect = decryptChunk(encrypted, correctPad, 0);

    // Should validate
    expect(validateMp4Header(decryptedCorrect)).toBe(true);
  });

  it('should handle multi-chunk file decryption', () => {
    const key = 'f626ad1ffb5159bef3e9295df34244af';
    const pad = generateXorPad(key);

    // Simulate file split into 3 chunks
    const chunk1 = new Uint8Array(5000); // Crosses 4096 boundary
    const chunk2 = new Uint8Array(3000);
    const chunk3 = new Uint8Array(2000);

    // Fill with test data
    for (let i = 0; i < chunk1.length; i++) chunk1[i] = i % 256;
    for (let i = 0; i < chunk2.length; i++) chunk2[i] = (i + 100) % 256;
    for (let i = 0; i < chunk3.length; i++) chunk3[i] = (i + 200) % 256;

    // Encrypt each chunk
    const encrypted1 = decryptChunk(chunk1, pad, 0);
    const encrypted2 = decryptChunk(chunk2, pad, chunk1.length);
    const encrypted3 = decryptChunk(chunk3, pad, chunk1.length + chunk2.length);

    // Decrypt back
    const decrypted1 = decryptChunk(encrypted1, pad, 0);
    const decrypted2 = decryptChunk(encrypted2, pad, chunk1.length);
    const decrypted3 = decryptChunk(encrypted3, pad, chunk1.length + chunk2.length);

    // Verify all chunks match original
    expect(decrypted1).toEqual(chunk1);
    expect(decrypted2).toEqual(chunk2);
    expect(decrypted3).toEqual(chunk3);
  });
});
