/**
 * Nexar Video Decryption Library
 *
 * Implements XOR-based encryption used by Nexar dashcam video files.
 * Based on LCG (Linear Congruential Generator) pseudo-random pad generation.
 */

export type HexKey = string;

// LCG constants matching Python implementation
const LCG_MULTIPLIER = 1103515245;
const LCG_INCREMENT = 12345;
const LCG_MODULUS = 2 ** 31;
const PAD_SIZE = 4096;

/**
 * Generate 4096-byte XOR pad from a 32-character key string
 *
 * Algorithm: LCG-based pseudo-random pad generation
 * 1. Treat key string as ASCII bytes (32 bytes)
 * 2. Initialize seed from key using XOR accumulation
 * 3. Generate pad bytes using LCG formula
 *
 * IMPORTANT: The key is treated as ASCII bytes, NOT hex-decoded.
 * A 32-character key "aa981a6b..." becomes 32 ASCII bytes, not 16 hex bytes.
 *
 * @param key - 32-character key string (e.g., "f626ad1ffb5159bef3e9295df34244af")
 * @returns 4096-byte XOR pad
 */
export function generateXorPad(key: HexKey): Uint8Array {
  // Normalize key to lowercase for consistent behavior
  const normalizedKey = key.toLowerCase();

  // Treat key as ASCII bytes (each character = 1 byte)
  // Pad to 32 bytes if shorter, matching Python's ljust(32, b'\x00')
  const paddedKey = new Uint8Array(32);
  for (let i = 0; i < Math.min(normalizedKey.length, 32); i++) {
    paddedKey[i] = normalizedKey.charCodeAt(i);
  }

  // Initialize seed from padded key
  // Use unsigned 32-bit arithmetic (>>>0 forces unsigned, then mask to 32 bits)
  let seed = 0;
  for (let i = 0; i < paddedKey.length; i++) {
    // In C, uint32_t wraps at 2^32. We simulate this with >>> 0
    seed = ((seed * 17) ^ paddedKey[i]) >>> 0;
  }

  // Generate 4096-byte pad using LCG
  const pad = new Uint8Array(PAD_SIZE);
  for (let i = 0; i < PAD_SIZE; i++) {
    // Use BigInt to avoid precision loss in multiplication
    // Then convert back to regular number with modulus
    seed = Number((BigInt(LCG_MULTIPLIER) * BigInt(seed) + BigInt(LCG_INCREMENT)) % BigInt(LCG_MODULUS));

    // XOR different parts of seed together to get pad byte
    pad[i] = ((seed >> 24) ^ (seed >> 16) ^ (seed >> 8) ^ seed) & 0xFF;
  }

  return pad;
}

/**
 * Decrypt data chunk using XOR pad
 *
 * Optimized for large files by processing chunks with offset tracking.
 * The pad cycles every 4096 bytes.
 *
 * @param data - Encrypted data chunk (any size)
 * @param pad - 4096-byte XOR pad from generateXorPad()
 * @param offset - Byte offset in the overall file (for pad cycling)
 * @returns Decrypted data
 *
 * @example
 * const pad = generateXorPad("f626ad1ffb5159bef3e9295df34244af");
 * const decryptedChunk1 = decryptChunk(encryptedChunk1, pad, 0);
 * const decryptedChunk2 = decryptChunk(encryptedChunk2, pad, encryptedChunk1.length);
 */
export function decryptChunk(data: Uint8Array, pad: Uint8Array, offset: number): Uint8Array {
  const result = new Uint8Array(data.length);

  for (let i = 0; i < data.length; i++) {
    // Calculate pad index with cycling (modulo PAD_SIZE)
    const padIndex = (offset + i) % PAD_SIZE;
    result[i] = data[i] ^ pad[padIndex];
  }

  return result;
}

/**
 * Validate that decrypted data has valid MP4 header
 *
 * MP4 files start with a "box" structure:
 * - Bytes 0-3: Box size (big-endian uint32)
 * - Bytes 4-7: Box type (ASCII, typically "ftyp")
 *
 * Valid first box types for MP4:
 * - "ftyp" - File type box (most common)
 * - "iso2", "isom", "mp41", "mp42" - ISO media file formats
 *
 * @param header - First bytes of decrypted file (at least 12 bytes)
 * @returns true if header matches MP4 structure
 *
 * @example
 * const decryptedHeader = decryptChunk(encryptedFile.slice(0, 12), pad, 0);
 * if (validateMp4Header(decryptedHeader)) {
 *   console.log("Valid MP4 file detected");
 * }
 */
export function validateMp4Header(header: Uint8Array): boolean {
  if (header.length < 12) {
    return false;
  }

  // Read box size (big-endian uint32)
  const boxSize = (header[0] << 24) | (header[1] << 16) | (header[2] << 8) | header[3];

  // Read box type (4 ASCII characters)
  const boxType = String.fromCharCode(header[4], header[5], header[6], header[7]);

  // Valid box types for MP4 files
  const validTypes = new Set(['ftyp', 'iso2', 'isom', 'mp41', 'mp42']);

  // Box size should be reasonable (8-1024 bytes for ftyp box)
  const validSize = boxSize >= 8 && boxSize <= 1024;

  return validSize && validTypes.has(boxType);
}
