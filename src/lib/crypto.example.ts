/**
 * Nexar Video Decryption - Usage Examples
 *
 * This file demonstrates how to use the crypto library to decrypt
 * Nexar dashcam video files encrypted with XOR cipher.
 */

import { generateXorPad, decryptChunk, validateMp4Header } from './crypto';

/**
 * Example 1: Decrypt a small file completely in memory
 */
export function decryptSmallFile(encryptedData: Uint8Array, hexKey: string): Uint8Array {
  // Generate the XOR pad from the key
  const pad = generateXorPad(hexKey);

  // Decrypt the entire file
  const decrypted = decryptChunk(encryptedData, pad, 0);

  // Validate the MP4 header
  if (!validateMp4Header(decrypted)) {
    throw new Error('Invalid decryption: MP4 header validation failed. Wrong key?');
  }

  return decrypted;
}

/**
 * Example 2: Decrypt a large file in chunks (streaming approach)
 *
 * This is the recommended approach for large video files (>10MB)
 * to avoid loading the entire file into memory.
 */
export async function decryptLargeFile(
  readChunk: (offset: number, size: number) => Promise<Uint8Array>,
  writeChunk: (data: Uint8Array) => Promise<void>,
  fileSize: number,
  hexKey: string,
  chunkSize: number = 1024 * 1024 // 1MB chunks by default
): Promise<void> {
  // Generate the XOR pad once
  const pad = generateXorPad(hexKey);

  // Read and decrypt first chunk to validate
  const firstChunk = await readChunk(0, Math.min(chunkSize, fileSize));
  const decryptedFirst = decryptChunk(firstChunk, pad, 0);

  // Validate MP4 header from first chunk
  if (!validateMp4Header(decryptedFirst.slice(0, 12))) {
    throw new Error('Invalid decryption: MP4 header validation failed. Wrong key?');
  }

  // Write first chunk
  await writeChunk(decryptedFirst);

  // Process remaining chunks
  let offset = chunkSize;
  while (offset < fileSize) {
    const size = Math.min(chunkSize, fileSize - offset);
    const chunk = await readChunk(offset, size);
    const decrypted = decryptChunk(chunk, pad, offset);
    await writeChunk(decrypted);
    offset += size;
  }
}

/**
 * Example 3: Browser File API usage
 *
 * Decrypt a file selected by the user in a browser environment
 */
export async function decryptBrowserFile(
  file: File,
  hexKey: string,
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const pad = generateXorPad(hexKey);
  const chunkSize = 1024 * 1024; // 1MB chunks
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
      throw new Error('Invalid key: Decrypted data does not have valid MP4 header');
    }

    chunks.push(decrypted);
    offset += size;

    if (onProgress) {
      onProgress((offset / file.size) * 100);
    }
  }

  return new Blob(chunks as BlobPart[], { type: 'video/mp4' });
}

/**
 * Example 4: Try multiple keys and return the correct one
 *
 * Useful when you have multiple possible keys and need to find
 * which one works.
 */
export function findCorrectKey(
  encryptedHeader: Uint8Array,
  possibleKeys: string[]
): string | null {
  // Only need first 12 bytes to validate MP4 header
  const headerToTest = encryptedHeader.slice(0, 12);

  for (const key of possibleKeys) {
    try {
      const pad = generateXorPad(key);
      const decrypted = decryptChunk(headerToTest, pad, 0);

      if (validateMp4Header(decrypted)) {
        return key; // Found the correct key!
      }
    } catch (error) {
      // Invalid key format, continue to next
      continue;
    }
  }

  return null; // No valid key found
}

/**
 * Example 5: Node.js fs usage with streams
 */
export async function decryptFileNodeJS(
  inputPath: string,
  outputPath: string,
  hexKey: string
): Promise<void> {
  // This example would require Node.js fs module
  // Shown as pseudocode for demonstration

  /*
  import * as fs from 'fs';
  import { pipeline } from 'stream/promises';

  const pad = generateXorPad(hexKey);
  const chunkSize = 1024 * 1024;
  let offset = 0;

  const readable = fs.createReadStream(inputPath, {
    highWaterMark: chunkSize
  });

  const writable = fs.createWriteStream(outputPath);

  for await (const chunk of readable) {
    const encryptedChunk = new Uint8Array(chunk);
    const decrypted = decryptChunk(encryptedChunk, pad, offset);

    if (offset === 0 && !validateMp4Header(decrypted.slice(0, 12))) {
      throw new Error('Invalid key');
    }

    writable.write(Buffer.from(decrypted));
    offset += chunk.length;
  }

  writable.end();
  */

  throw new Error('This is a pseudocode example. Implement with actual fs module.');
}
