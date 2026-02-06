/**
 * Comprehensive test suite for validation utilities
 * Tests all validation functions with happy paths, edge cases, and error conditions
 */

import {
  validateHexKey,
  parseGDriveUrl,
  sanitizeFilename,
  validateMp4File,
  validateFileSize,
  validateTotalSize,
  formatFileSize,
  VALIDATION_CONSTANTS,
} from '../validation';

describe('validateHexKey', () => {
  describe('Happy path', () => {
    it('should accept valid 32-character lowercase hex key', () => {
      expect(validateHexKey('f626ad1ffb5159bef3e9295df34244af')).toBe(true);
    });

    it('should accept valid 32-character uppercase hex key', () => {
      expect(validateHexKey('F626AD1FFB5159BEF3E9295DF34244AF')).toBe(true);
    });

    it('should accept valid 32-character mixed-case hex key', () => {
      expect(validateHexKey('F626ad1FFB5159bef3e9295df34244AF')).toBe(true);
    });

    it('should accept key with all zeros', () => {
      expect(validateHexKey('00000000000000000000000000000000')).toBe(true);
    });

    it('should accept key with all f characters', () => {
      expect(validateHexKey('ffffffffffffffffffffffffffffffff')).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should reject key with 31 characters', () => {
      expect(validateHexKey('f626ad1ffb5159bef3e9295df34244a')).toBe(false);
    });

    it('should reject key with 33 characters', () => {
      expect(validateHexKey('f626ad1ffb5159bef3e9295df34244aff')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(validateHexKey('')).toBe(false);
    });

    it('should reject key with spaces', () => {
      expect(validateHexKey('f626ad1f fb5159bef3e9295df34244af')).toBe(false);
    });

    it('should reject key with non-hex characters', () => {
      expect(validateHexKey('g626ad1ffb5159bef3e9295df34244af')).toBe(false);
      expect(validateHexKey('f626ad1ffb5159bef3e9295df34244az')).toBe(false);
    });

    it('should reject key with special characters', () => {
      expect(validateHexKey('f626ad1f-fb5159bef3e9295df34244af')).toBe(false);
    });
  });

  describe('Error conditions', () => {
    it('should reject null', () => {
      expect(validateHexKey(null as any)).toBe(false);
    });

    it('should reject undefined', () => {
      expect(validateHexKey(undefined as any)).toBe(false);
    });

    it('should reject number', () => {
      expect(validateHexKey(123 as any)).toBe(false);
    });

    it('should reject object', () => {
      expect(validateHexKey({} as any)).toBe(false);
    });

    it('should reject array', () => {
      expect(validateHexKey([] as any)).toBe(false);
    });
  });
});

describe('parseGDriveUrl', () => {
  describe('Happy path - URL formats', () => {
    it('should extract folder ID from standard URL', () => {
      const url = 'https://drive.google.com/drive/folders/1ABC123def456_-xyz';
      expect(parseGDriveUrl(url)).toBe('1ABC123def456_-xyz');
    });

    it('should extract folder ID from URL with user prefix', () => {
      const url = 'https://drive.google.com/drive/u/0/folders/1ABC123def456';
      expect(parseGDriveUrl(url)).toBe('1ABC123def456');
    });

    it('should extract folder ID from URL with query parameters', () => {
      const url = 'https://drive.google.com/drive/folders/1ABC123def456?usp=sharing';
      expect(parseGDriveUrl(url)).toBe('1ABC123def456');
    });

    it('should extract folder ID from URL with multiple query parameters', () => {
      const url = 'https://drive.google.com/drive/folders/1ABC123def456?usp=sharing&resourcekey=xyz';
      expect(parseGDriveUrl(url)).toBe('1ABC123def456');
    });

    it('should handle URL with trailing slash', () => {
      const url = 'https://drive.google.com/drive/folders/1ABC123def456/';
      expect(parseGDriveUrl(url)).toBe('1ABC123def456');
    });
  });

  describe('Happy path - Direct folder ID', () => {
    it('should accept valid folder ID directly (33 chars)', () => {
      expect(parseGDriveUrl('1ABC123def456_-xyz789012345678')).toBe('1ABC123def456_-xyz789012345678');
    });

    it('should accept valid folder ID with underscores', () => {
      expect(parseGDriveUrl('1ABC_123_def_456')).toBe('1ABC_123_def_456');
    });

    it('should accept valid folder ID with hyphens', () => {
      expect(parseGDriveUrl('1ABC-123-def-456')).toBe('1ABC-123-def-456');
    });
  });

  describe('Edge cases', () => {
    it('should return null for invalid URL', () => {
      expect(parseGDriveUrl('https://example.com')).toBeNull();
    });

    it('should return null for string too short to be folder ID', () => {
      expect(parseGDriveUrl('abc123')).toBeNull();
    });

    it('should return null for string too long to be folder ID', () => {
      const longString = 'a'.repeat(50);
      expect(parseGDriveUrl(longString)).toBeNull();
    });

    it('should return null for folder ID with invalid characters', () => {
      expect(parseGDriveUrl('1ABC@123#def$456')).toBeNull();
    });

    it('should handle whitespace around URL', () => {
      const url = '  https://drive.google.com/drive/folders/1ABC123def456  ';
      expect(parseGDriveUrl(url)).toBe('1ABC123def456');
    });

    it('should handle whitespace around folder ID', () => {
      expect(parseGDriveUrl('  1ABC123def456_xyz  ')).toBe('1ABC123def456_xyz');
    });
  });

  describe('Error conditions', () => {
    it('should return null for empty string', () => {
      expect(parseGDriveUrl('')).toBeNull();
    });

    it('should return null for null', () => {
      expect(parseGDriveUrl(null as any)).toBeNull();
    });

    it('should return null for undefined', () => {
      expect(parseGDriveUrl(undefined as any)).toBeNull();
    });

    it('should return null for number', () => {
      expect(parseGDriveUrl(123 as any)).toBeNull();
    });

    it('should return null for whitespace only', () => {
      expect(parseGDriveUrl('   ')).toBeNull();
    });
  });
});

describe('sanitizeFilename', () => {
  describe('Happy path', () => {
    it('should keep safe filename unchanged', () => {
      expect(sanitizeFilename('normal_file.mp4')).toBe('normal_file.mp4');
    });

    it('should keep alphanumeric names', () => {
      expect(sanitizeFilename('video123.mp4')).toBe('video123.mp4');
    });

    it('should keep names with spaces', () => {
      expect(sanitizeFilename('my video file.mp4')).toBe('my video file.mp4');
    });

    it('should keep names with hyphens and underscores', () => {
      expect(sanitizeFilename('my-video_file.mp4')).toBe('my-video_file.mp4');
    });
  });

  describe('Security - Path traversal prevention', () => {
    it('should sanitize path traversal attempt', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('etc_passwd');
    });

    it('should replace forward slashes with underscores', () => {
      expect(sanitizeFilename('path/to/file.mp4')).toBe('path_to_file.mp4');
    });

    it('should replace backslashes with underscores', () => {
      expect(sanitizeFilename('path\\to\\file.mp4')).toBe('path_to_file.mp4');
    });

    it('should remove leading dots', () => {
      expect(sanitizeFilename('...hidden.mp4')).toBe('hidden.mp4');
    });

    it('should remove null bytes', () => {
      expect(sanitizeFilename('file\0name.mp4')).toBe('filename.mp4');
    });

    it('should remove control characters', () => {
      expect(sanitizeFilename('file\x00\x1F\x7Fname.mp4')).toBe('filename.mp4');
    });
  });

  describe('Edge cases', () => {
    it('should handle very long filenames', () => {
      const longName = 'a'.repeat(300) + '.mp4';
      const result = sanitizeFilename(longName);
      expect(result.length).toBeLessThanOrEqual(255);
      expect(result.endsWith('.mp4')).toBe(true);
    });

    it('should preserve extension when truncating', () => {
      const longName = 'a'.repeat(300) + '.mp4';
      const result = sanitizeFilename(longName);
      expect(result.endsWith('.mp4')).toBe(true);
      expect(result.length).toBe(255);
    });

    it('should truncate without extension if no extension exists', () => {
      const longName = 'a'.repeat(300);
      const result = sanitizeFilename(longName);
      expect(result.length).toBe(255);
    });

    it('should handle empty string', () => {
      expect(sanitizeFilename('')).toBe('unnamed');
    });

    it('should handle whitespace only', () => {
      expect(sanitizeFilename('   ')).toBe('unnamed');
    });

    it('should return unnamed if only path separators', () => {
      expect(sanitizeFilename('///')).toBe('unnamed');
    });

    it('should return unnamed if only dots', () => {
      expect(sanitizeFilename('...')).toBe('unnamed');
    });
  });

  describe('Error conditions', () => {
    it('should return unnamed for null', () => {
      expect(sanitizeFilename(null as any)).toBe('unnamed');
    });

    it('should return unnamed for undefined', () => {
      expect(sanitizeFilename(undefined as any)).toBe('unnamed');
    });

    it('should return unnamed for number', () => {
      expect(sanitizeFilename(123 as any)).toBe('unnamed');
    });

    it('should return unnamed for object', () => {
      expect(sanitizeFilename({} as any)).toBe('unnamed');
    });
  });
});

describe('validateMp4File', () => {
  // Helper to create a mock File with specific bytes
  function createMockFile(bytes: number[], filename = 'test.mp4'): File {
    const buffer = new Uint8Array(bytes);
    return new File([buffer], filename, { type: 'video/mp4' });
  }

  describe('Happy path', () => {
    it('should accept valid MP4 file with ftyp signature', async () => {
      // Valid MP4: first 4 bytes (size), then 'ftyp' at bytes 4-7
      const validMp4Bytes = [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70];
      const file = createMockFile(validMp4Bytes);
      expect(await validateMp4File(file)).toBe(true);
    });

    it('should accept MP4 with additional data after header', async () => {
      const validMp4Bytes = [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x00, 0x00];
      const file = createMockFile(validMp4Bytes);
      expect(await validateMp4File(file)).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should reject file with wrong magic bytes', async () => {
      const invalidBytes = [0x00, 0x00, 0x00, 0x20, 0x61, 0x62, 0x63, 0x64];
      const file = createMockFile(invalidBytes);
      expect(await validateMp4File(file)).toBe(false);
    });

    it('should reject file smaller than 8 bytes', async () => {
      const tooSmall = [0x66, 0x74, 0x79];
      const file = createMockFile(tooSmall);
      expect(await validateMp4File(file)).toBe(false);
    });

    it('should reject empty file', async () => {
      const file = createMockFile([]);
      expect(await validateMp4File(file)).toBe(false);
    });

    it('should reject file with partial ftyp signature', async () => {
      const partialBytes = [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x00];
      const file = createMockFile(partialBytes);
      expect(await validateMp4File(file)).toBe(false);
    });
  });

  describe('Error conditions', () => {
    it('should reject null', async () => {
      expect(await validateMp4File(null as any)).toBe(false);
    });

    it('should reject undefined', async () => {
      expect(await validateMp4File(undefined as any)).toBe(false);
    });

    it('should reject non-File object', async () => {
      expect(await validateMp4File({} as any)).toBe(false);
    });

    it('should reject string', async () => {
      expect(await validateMp4File('file.mp4' as any)).toBe(false);
    });
  });
});

describe('validateFileSize', () => {
  // Helper to create a mock File with specific size
  function createMockFileOfSize(sizeBytes: number): File {
    const buffer = new Uint8Array(sizeBytes);
    return new File([buffer], 'test.mp4', { type: 'video/mp4' });
  }

  describe('Happy path', () => {
    it('should accept file smaller than default limit (2GB)', () => {
      const file = createMockFileOfSize(1024 * 1024 * 100); // 100MB
      expect(validateFileSize(file)).toBe(true);
    });

    it('should accept file exactly at default limit', () => {
      const file = createMockFileOfSize(VALIDATION_CONSTANTS.MAX_FILE_SIZE);
      expect(validateFileSize(file)).toBe(true);
    });

    it('should accept file smaller than custom limit', () => {
      const file = createMockFileOfSize(50 * 1024 * 1024); // 50MB
      expect(validateFileSize(file, 100 * 1024 * 1024)).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should reject file larger than default limit', () => {
      const file = createMockFileOfSize(VALIDATION_CONSTANTS.MAX_FILE_SIZE + 1);
      expect(validateFileSize(file)).toBe(false);
    });

    it('should reject file larger than custom limit', () => {
      const file = createMockFileOfSize(150 * 1024 * 1024); // 150MB
      expect(validateFileSize(file, 100 * 1024 * 1024)).toBe(false);
    });

    it('should accept zero-byte file', () => {
      const file = createMockFileOfSize(0);
      expect(validateFileSize(file)).toBe(true);
    });

    it('should reject if custom limit is zero', () => {
      const file = createMockFileOfSize(100);
      expect(validateFileSize(file, 0)).toBe(false);
    });

    it('should reject if custom limit is negative', () => {
      const file = createMockFileOfSize(100);
      expect(validateFileSize(file, -1)).toBe(false);
    });
  });

  describe('Error conditions', () => {
    it('should reject null', () => {
      expect(validateFileSize(null as any)).toBe(false);
    });

    it('should reject undefined', () => {
      expect(validateFileSize(undefined as any)).toBe(false);
    });

    it('should reject non-File object', () => {
      expect(validateFileSize({} as any)).toBe(false);
    });
  });
});

describe('validateTotalSize', () => {
  function createMockFileOfSize(sizeBytes: number, name: string): File {
    const buffer = new Uint8Array(sizeBytes);
    return new File([buffer], name, { type: 'video/mp4' });
  }

  describe('Happy path', () => {
    it('should accept files smaller than default limit (10GB)', () => {
      const files = [
        createMockFileOfSize(1024 * 1024 * 1000, 'file1.mp4'), // 1GB
        createMockFileOfSize(1024 * 1024 * 2000, 'file2.mp4'), // 2GB
      ];
      expect(validateTotalSize(files)).toBe(true);
    });

    it('should accept files exactly at default limit', () => {
      const files = [
        createMockFileOfSize(VALIDATION_CONSTANTS.MAX_TOTAL_SIZE, 'file1.mp4'),
      ];
      expect(validateTotalSize(files)).toBe(true);
    });

    it('should accept files smaller than custom limit', () => {
      const files = [
        createMockFileOfSize(50 * 1024 * 1024, 'file1.mp4'),
        createMockFileOfSize(30 * 1024 * 1024, 'file2.mp4'),
      ];
      expect(validateTotalSize(files, 100 * 1024 * 1024)).toBe(true);
    });

    it('should accept single file', () => {
      const files = [createMockFileOfSize(100 * 1024 * 1024, 'file1.mp4')];
      expect(validateTotalSize(files)).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should reject files larger than default limit', () => {
      const files = [
        createMockFileOfSize(VALIDATION_CONSTANTS.MAX_TOTAL_SIZE / 2 + 1, 'file1.mp4'),
        createMockFileOfSize(VALIDATION_CONSTANTS.MAX_TOTAL_SIZE / 2 + 1, 'file2.mp4'),
      ];
      expect(validateTotalSize(files)).toBe(false);
    });

    it('should reject files larger than custom limit', () => {
      const files = [
        createMockFileOfSize(60 * 1024 * 1024, 'file1.mp4'),
        createMockFileOfSize(50 * 1024 * 1024, 'file2.mp4'),
      ];
      expect(validateTotalSize(files, 100 * 1024 * 1024)).toBe(false);
    });

    it('should handle array with zero-byte files', () => {
      const files = [
        createMockFileOfSize(0, 'file1.mp4'),
        createMockFileOfSize(0, 'file2.mp4'),
      ];
      expect(validateTotalSize(files)).toBe(true);
    });

    it('should reject empty array', () => {
      expect(validateTotalSize([])).toBe(false);
    });

    it('should ignore non-File objects in array', () => {
      const files = [
        createMockFileOfSize(100 * 1024 * 1024, 'file1.mp4'),
        {} as File,
        null as any,
      ];
      expect(validateTotalSize(files, 200 * 1024 * 1024)).toBe(true);
    });

    it('should reject if custom limit is zero', () => {
      const files = [createMockFileOfSize(100, 'file1.mp4')];
      expect(validateTotalSize(files, 0)).toBe(false);
    });

    it('should reject if custom limit is negative', () => {
      const files = [createMockFileOfSize(100, 'file1.mp4')];
      expect(validateTotalSize(files, -1)).toBe(false);
    });
  });

  describe('Error conditions', () => {
    it('should reject null', () => {
      expect(validateTotalSize(null as any)).toBe(false);
    });

    it('should reject undefined', () => {
      expect(validateTotalSize(undefined as any)).toBe(false);
    });

    it('should reject non-array', () => {
      expect(validateTotalSize({} as any)).toBe(false);
    });
  });
});

describe('VALIDATION_CONSTANTS', () => {
  it('should export MAX_FILE_SIZE as 2GB', () => {
    expect(VALIDATION_CONSTANTS.MAX_FILE_SIZE).toBe(2 * 1024 * 1024 * 1024);
  });

  it('should export MAX_TOTAL_SIZE as 10GB', () => {
    expect(VALIDATION_CONSTANTS.MAX_TOTAL_SIZE).toBe(10 * 1024 * 1024 * 1024);
  });

  it('should export MAX_FILENAME_LENGTH as 255', () => {
    expect(VALIDATION_CONSTANTS.MAX_FILENAME_LENGTH).toBe(255);
  });
});

describe('formatFileSize', () => {
  describe('Happy path', () => {
    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500 B');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB');
    });
  });

  describe('Edge cases', () => {
    it('should handle zero bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('should handle exact power-of-two boundaries', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should round to one decimal place', () => {
      expect(formatFileSize(1234)).toBe('1.2 KB');
      expect(formatFileSize(1567890)).toBe('1.5 MB');
    });
  });
});

describe('validateMp4File error handling', () => {
  it('should return false when arrayBuffer throws an error', async () => {
    // Create a valid MP4 header file first
    const mp4Header = new Uint8Array([0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70]); // ftyp at bytes 4-7
    const file = new File([mp4Header], 'test.mp4', { type: 'video/mp4' });

    // Mock the slice method to return a blob that throws on arrayBuffer
    const originalSlice = file.slice.bind(file);
    file.slice = (...args: Parameters<typeof originalSlice>) => {
      const blob = originalSlice(...args);
      blob.arrayBuffer = () => Promise.reject(new Error('Read error'));
      return blob;
    };

    const result = await validateMp4File(file);
    expect(result).toBe(false);
  });
});
