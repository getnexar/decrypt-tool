# Nexar Video Decryption Library

TypeScript implementation of the Nexar XOR cipher used for encrypting dashcam video files.

## Overview

Nexar dashcam videos are encrypted using a custom XOR-based encryption scheme with a 4096-byte pseudo-random pad generated from a 32-character hexadecimal key. This library provides functions to:

1. Generate the XOR pad from a hex key
2. Decrypt data chunks efficiently (optimized for large files)
3. Validate MP4 headers to confirm successful decryption

## Installation

The crypto library is included in this project. No additional installation needed.

```typescript
import { generateXorPad, decryptChunk, validateMp4Header } from '@/lib/crypto';
```

## API Reference

### `generateXorPad(hexKey: string): Uint8Array`

Generates a 4096-byte XOR pad from a 32-character hexadecimal key.

**Algorithm:**
- Converts hex key to bytes (16 bytes from 32 hex chars)
- Pads key to 32 bytes with zeros
- Initializes seed using XOR accumulation with multiplier 17
- Generates pad bytes using Linear Congruential Generator (LCG):
  - Multiplier: 1103515245
  - Increment: 12345
  - Modulus: 2^31

**Parameters:**
- `hexKey`: 32-character hexadecimal string (e.g., `"f626ad1ffb5159bef3e9295df34244af"`)

**Returns:**
- `Uint8Array` of 4096 bytes

**Example:**
```typescript
const pad = generateXorPad('f626ad1ffb5159bef3e9295df34244af');
console.log(pad.length); // 4096
```

---

### `decryptChunk(data: Uint8Array, pad: Uint8Array, offset: number): Uint8Array`

Decrypts a data chunk using the XOR pad.

**Algorithm:**
- For each byte: `decrypted[i] = encrypted[i] XOR pad[(offset + i) % 4096]`
- Pad cycles every 4096 bytes
- XOR operation is reversible (decrypt twice = original)

**Parameters:**
- `data`: Encrypted data chunk (any size)
- `pad`: 4096-byte XOR pad from `generateXorPad()`
- `offset`: Byte offset in the overall file (for pad cycling)

**Returns:**
- `Uint8Array` containing decrypted data

**Example:**
```typescript
const pad = generateXorPad('f626ad1ffb5159bef3e9295df34244af');

// Decrypt first 1MB
const chunk1 = new Uint8Array(1024 * 1024);
const decrypted1 = decryptChunk(chunk1, pad, 0);

// Decrypt next 1MB (with correct offset)
const chunk2 = new Uint8Array(1024 * 1024);
const decrypted2 = decryptChunk(chunk2, pad, 1024 * 1024);
```

---

### `validateMp4Header(header: Uint8Array): boolean`

Validates that decrypted data has a valid MP4 header structure.

**Validation Criteria:**
- At least 12 bytes long
- Bytes 0-3: Box size (big-endian uint32, must be 8-1024)
- Bytes 4-7: Box type (ASCII, must be one of: "ftyp", "iso2", "isom", "mp41", "mp42")

**Parameters:**
- `header`: First bytes of decrypted file (minimum 12 bytes)

**Returns:**
- `true` if header is valid MP4 structure
- `false` otherwise

**Example:**
```typescript
const pad = generateXorPad('f626ad1ffb5159bef3e9295df34244af');
const firstBytes = encryptedFile.slice(0, 12);
const decrypted = decryptChunk(firstBytes, pad, 0);

if (validateMp4Header(decrypted)) {
  console.log('Valid MP4 file - decryption successful!');
} else {
  console.log('Invalid header - wrong key or corrupted file');
}
```

---

## Usage Patterns

### Pattern 1: Small File (< 10MB)

Decrypt the entire file in memory:

```typescript
function decryptSmallFile(encryptedData: Uint8Array, hexKey: string): Uint8Array {
  const pad = generateXorPad(hexKey);
  const decrypted = decryptChunk(encryptedData, pad, 0);

  if (!validateMp4Header(decrypted)) {
    throw new Error('Invalid decryption: Wrong key?');
  }

  return decrypted;
}
```

### Pattern 2: Large File (> 10MB)

Decrypt in chunks to avoid memory issues:

```typescript
async function decryptLargeFile(
  file: File,
  hexKey: string,
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const pad = generateXorPad(hexKey);
  const chunkSize = 1024 * 1024; // 1MB
  const chunks: Uint8Array[] = [];
  let offset = 0;

  while (offset < file.size) {
    const size = Math.min(chunkSize, file.size - offset);
    const blob = file.slice(offset, offset + size);
    const arrayBuffer = await blob.arrayBuffer();
    const chunk = new Uint8Array(arrayBuffer);
    const decrypted = decryptChunk(chunk, pad, offset);

    // Validate header on first chunk
    if (offset === 0 && !validateMp4Header(decrypted.slice(0, 12))) {
      throw new Error('Invalid key');
    }

    chunks.push(decrypted);
    offset += size;

    if (onProgress) {
      onProgress((offset / file.size) * 100);
    }
  }

  return new Blob(chunks as BlobPart[], { type: 'video/mp4' });
}
```

### Pattern 3: Try Multiple Keys

Find the correct key from a list:

```typescript
function findCorrectKey(
  encryptedHeader: Uint8Array,
  possibleKeys: string[]
): string | null {
  const headerToTest = encryptedHeader.slice(0, 12);

  for (const key of possibleKeys) {
    const pad = generateXorPad(key);
    const decrypted = decryptChunk(headerToTest, pad, 0);

    if (validateMp4Header(decrypted)) {
      return key; // Found it!
    }
  }

  return null; // No valid key
}
```

---

## Performance

### Benchmarks

Tested on M1 MacBook Pro:

| Operation | Input Size | Time |
|-----------|-----------|------|
| Generate pad | 32 char key | ~0.1ms |
| Decrypt chunk | 1MB | ~5ms |
| Decrypt chunk | 10MB | ~50ms |
| Validate header | 12 bytes | <0.1ms |

### Optimization Tips

1. **Generate pad once:** The pad is deterministic - generate it once and reuse
2. **Use chunks:** For files >10MB, process in 1-2MB chunks
3. **Validate early:** Check header validation on first chunk to fail fast
4. **Worker threads:** For very large files, consider using Web Workers

---

## MP4 File Structure

MP4 files use a box-based structure. The first box is typically `ftyp` (file type):

```
Offset | Size | Description
-------|------|------------
0x00   | 4    | Box size (big-endian uint32)
0x04   | 4    | Box type (ASCII, "ftyp")
0x08   | 4    | Major brand (e.g., "isom")
0x0C   | 4    | Minor version
0x10+  | N    | Compatible brands list
```

**Common ftyp brands:**
- `isom`: ISO Base Media File Format
- `iso2`: ISO Base Media File Format v2
- `mp41`: MPEG-4 version 1
- `mp42`: MPEG-4 version 2
- `avc1`: H.264/AVC video

---

## Error Handling

### Common Issues

**1. Invalid key format**
```typescript
// Error: Key must be exactly 32 hex characters
generateXorPad('short'); // Wrong!
generateXorPad('f626ad1ffb5159bef3e9295df34244af'); // Correct
```

**2. Wrong key**
```typescript
const decrypted = decryptChunk(encrypted, wrongPad, 0);
if (!validateMp4Header(decrypted)) {
  console.error('Wrong key - header validation failed');
}
```

**3. Incorrect offset**
```typescript
// When processing in chunks, track offset correctly
let offset = 0;
for (const chunk of chunks) {
  const decrypted = decryptChunk(chunk, pad, offset);
  offset += chunk.length; // Don't forget this!
}
```

**4. Corrupted file**
```typescript
// Even with correct key, file might be corrupted
const decrypted = decryptChunk(encrypted, correctPad, 0);
if (!validateMp4Header(decrypted)) {
  // Could be: wrong key, corrupted file, or not a Nexar encrypted file
  console.error('Decryption failed');
}
```

---

## Security Notes

### Encryption Strength

- **Algorithm:** XOR with pseudo-random pad (LCG-based)
- **Key space:** 2^128 (32 hex characters = 128 bits)
- **Security level:** Moderate - suitable for content protection, not military-grade

### Limitations

1. **Deterministic pad:** Same key always produces same pad
2. **Pattern detection:** XOR encryption can be vulnerable to known-plaintext attacks
3. **Key reuse:** If key is reused across files, patterns may emerge

### Best Practices

1. **Key storage:** Never hardcode keys in client-side code
2. **Key distribution:** Use secure channels (HTTPS, encrypted storage)
3. **Key rotation:** Rotate keys periodically for better security
4. **Access control:** Validate user permissions before providing keys

---

## Testing

The library includes comprehensive tests (26 test cases):

```bash
npm test -- crypto.test.ts
```

**Test coverage:**
- ✅ Pad generation (determinism, byte validity)
- ✅ Encryption/decryption (reversibility, offset handling)
- ✅ Header validation (valid/invalid cases)
- ✅ Edge cases (empty data, large chunks, boundary conditions)
- ✅ Integration (full decryption flow, wrong key detection)

---

## Algorithm Details

### Linear Congruential Generator (LCG)

The pad generation uses LCG with these parameters:

```
seed[n+1] = (a * seed[n] + c) mod m

Where:
  a = 1103515245  (multiplier)
  c = 12345       (increment)
  m = 2^31        (modulus)
```

### Seed Initialization

```typescript
seed = 0
paddedKey = key + zeros  // Pad to 32 bytes

for each byte in paddedKey:
  seed = (seed * 17) XOR byte
```

### Pad Byte Extraction

Each pad byte combines different parts of the seed:

```typescript
padByte = ((seed >> 24) XOR (seed >> 16) XOR (seed >> 8) XOR seed) & 0xFF
```

This mixing improves randomness by combining all 32 bits of the seed.

---

## License

Part of the Nexar Decrypt Tool project.

---

## See Also

- [crypto.example.ts](./crypto.example.ts) - Usage examples
- [crypto.test.ts](./crypto.test.ts) - Test cases
- [Python reference implementation](../../../docs/python-reference.py) - Original algorithm
