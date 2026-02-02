/**
 * Validation utilities for the decrypt tool
 * Provides functions for validating hex keys, Google Drive URLs, filenames, and file contents
 */

// Constants
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
const MAX_TOTAL_SIZE = 10 * 1024 * 1024 * 1024; // 10GB
const MAX_FILENAME_LENGTH = 255;

/**
 * Validate that a string is a valid 32-character hex decryption key
 * @param key - The key to validate
 * @returns true if valid (exactly 32 hex characters), false otherwise
 *
 * @example
 * validateHexKey('f626ad1ffb5159bef3e9295df34244af') // true
 * validateHexKey('invalid') // false
 * validateHexKey('f626ad1ffb5159bef3e9295df34244a') // false (31 chars)
 */
export function validateHexKey(key: string): boolean {
  if (!key || typeof key !== 'string') {
    return false;
  }

  // Must be exactly 32 characters and only contain 0-9, a-f, A-F
  const hexKeyPattern = /^[0-9a-fA-F]{32}$/;
  return hexKeyPattern.test(key);
}

/**
 * Extract Google Drive folder ID from various URL formats
 *
 * Supports:
 * - https://drive.google.com/drive/folders/FOLDER_ID
 * - https://drive.google.com/drive/u/0/folders/FOLDER_ID
 * - https://drive.google.com/drive/folders/FOLDER_ID?usp=sharing
 * - Just the folder ID itself
 *
 * @param url - The URL or folder ID to parse
 * @returns folder ID or null if invalid
 *
 * @example
 * parseGDriveUrl('https://drive.google.com/drive/folders/1ABC123def456') // '1ABC123def456'
 * parseGDriveUrl('1ABC123def456') // '1ABC123def456'
 * parseGDriveUrl('not-a-url') // null
 */
export function parseGDriveUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmedUrl = url.trim();

  // Pattern to extract folder ID from Google Drive URLs
  // The folder ID is typically a 33-character alphanumeric string with underscores/hyphens
  const urlPattern = /\/folders\/([a-zA-Z0-9_-]+)/;
  const match = trimmedUrl.match(urlPattern);

  if (match && match[1]) {
    return match[1];
  }

  // If it doesn't look like a URL, check if it's already a valid folder ID
  // Folder IDs are typically 15-40 characters, alphanumeric with underscores/hyphens
  const folderIdPattern = /^[a-zA-Z0-9_-]{15,40}$/;
  if (folderIdPattern.test(trimmedUrl)) {
    return trimmedUrl;
  }

  return null;
}

/**
 * Sanitize filename to prevent path traversal attacks
 *
 * Security measures:
 * - Removes path separators (/, \)
 * - Removes null bytes
 * - Removes leading dots
 * - Removes control characters
 * - Limits length to 255 chars
 * - Returns 'unnamed' if result is empty
 * - Preserves file extension
 *
 * @param name - The filename to sanitize
 * @returns Sanitized filename safe for use
 *
 * @example
 * sanitizeFilename('../../../etc/passwd') // 'etc_passwd'
 * sanitizeFilename('normal_file.mp4') // 'normal_file.mp4'
 * sanitizeFilename('../../malicious.exe') // 'malicious.exe'
 */
export function sanitizeFilename(name: string): string {
  if (!name || typeof name !== 'string') {
    return 'unnamed';
  }

  let sanitized = name.trim();

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove control characters (ASCII 0-31 and 127)
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // Replace path separators with underscores
  sanitized = sanitized.replace(/[/\\]/g, '_');

  // Remove leading dots and underscores (after path separator replacement)
  // This handles cases like "../../../etc/passwd" → "_.._.._etc_passwd" → "etc_passwd"
  sanitized = sanitized.replace(/^[._]+/, '');

  // After replacing path separators, clean up any resulting underscores-only names
  if (/^_+$/.test(sanitized)) {
    return 'unnamed';
  }

  // Limit length (preserve extension if possible)
  if (sanitized.length > MAX_FILENAME_LENGTH) {
    const extensionMatch = sanitized.match(/(\.[^.]+)$/);
    if (extensionMatch) {
      const extension = extensionMatch[1];
      const nameWithoutExt = sanitized.slice(0, sanitized.length - extension.length);
      sanitized = nameWithoutExt.slice(0, MAX_FILENAME_LENGTH - extension.length) + extension;
    } else {
      sanitized = sanitized.slice(0, MAX_FILENAME_LENGTH);
    }
  }

  // If after all sanitization we have nothing left, return 'unnamed'
  if (sanitized.length === 0) {
    return 'unnamed';
  }

  return sanitized;
}

/**
 * Validate that a File is an MP4 by checking magic bytes
 *
 * MP4 files have 'ftyp' at bytes 4-7 (part of the ftyp box header)
 * This is a quick check, not full MP4 validation
 *
 * @param file - File to check
 * @returns Promise<boolean> - true if file appears to be MP4
 *
 * @example
 * const file = new File([...], 'video.mp4');
 * const isValid = await validateMp4File(file); // true if MP4
 */
export async function validateMp4File(file: File): Promise<boolean> {
  if (!file || !(file instanceof File)) {
    return false;
  }

  // We need at least 8 bytes to check the magic bytes
  if (file.size < 8) {
    return false;
  }

  try {
    // Read first 8 bytes
    const slice = file.slice(0, 8);
    const arrayBuffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Check if bytes 4-7 contain 'ftyp' (in ASCII)
    // 'f' = 0x66, 't' = 0x74, 'y' = 0x79, 'p' = 0x70
    const isMp4 = (
      bytes[4] === 0x66 && // 'f'
      bytes[5] === 0x74 && // 't'
      bytes[6] === 0x79 && // 'y'
      bytes[7] === 0x70    // 'p'
    );

    return isMp4;
  } catch (error) {
    console.error('Error validating MP4 file:', error);
    return false;
  }
}

/**
 * Validate file size is within limits
 *
 * @param file - File to check
 * @param maxSizeBytes - Maximum size in bytes (default 2GB)
 * @returns true if within limit, false otherwise
 *
 * @example
 * validateFileSize(file) // true if file < 2GB
 * validateFileSize(file, 100 * 1024 * 1024) // true if file < 100MB
 */
export function validateFileSize(
  file: File,
  maxSizeBytes: number = MAX_FILE_SIZE
): boolean {
  if (!file || !(file instanceof File)) {
    return false;
  }

  if (maxSizeBytes <= 0) {
    return false;
  }

  return file.size <= maxSizeBytes;
}

/**
 * Validate total job size is within limits
 *
 * @param files - Array of files to check
 * @param maxTotalBytes - Maximum total size in bytes (default 10GB)
 * @returns true if total size is within limit, false otherwise
 *
 * @example
 * validateTotalSize([file1, file2, file3]) // true if total < 10GB
 * validateTotalSize(files, 5 * 1024 * 1024 * 1024) // true if total < 5GB
 */
export function validateTotalSize(
  files: File[],
  maxTotalBytes: number = MAX_TOTAL_SIZE
): boolean {
  if (!Array.isArray(files) || files.length === 0) {
    return false;
  }

  if (maxTotalBytes <= 0) {
    return false;
  }

  const totalSize = files.reduce((sum, file) => {
    if (!(file instanceof File)) {
      return sum;
    }
    return sum + file.size;
  }, 0);

  return totalSize <= maxTotalBytes;
}

/**
 * Format file size in bytes to human-readable string
 *
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.5 MB", "2.3 GB")
 *
 * @example
 * formatFileSize(1024) // "1.0 KB"
 * formatFileSize(1536000) // "1.5 MB"
 * formatFileSize(2147483648) // "2.0 GB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Export constants for use in other modules
export const VALIDATION_CONSTANTS = {
  MAX_FILE_SIZE,
  MAX_TOTAL_SIZE,
  MAX_FILENAME_LENGTH,
} as const;
