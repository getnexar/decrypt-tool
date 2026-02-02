/**
 * Tests for Web Worker Decryption
 *
 * Note: Testing Web Workers in Node.js requires special handling.
 * These tests focus on the worker's message handling logic.
 */

import { generateXorPad, decryptChunk, validateMp4Header } from '@/lib/crypto'
import type { DecryptWorkerInput, DecryptWorkerOutput } from '../types'

describe('Decrypt Worker Message Types', () => {
  it('should have correct input message structure', () => {
    const input: DecryptWorkerInput = {
      type: 'decrypt',
      file: new File(['test'], 'test.mp4'),
      key: 'f626ad1ffb5159bef3e9295df34244af',
      fileIndex: 0
    }

    expect(input.type).toBe('decrypt')
    expect(input.file).toBeInstanceOf(File)
    expect(input.key).toHaveLength(32)
    expect(input.fileIndex).toBe(0)
  })

  it('should validate progress message structure', () => {
    const progress: DecryptWorkerOutput = {
      type: 'progress',
      fileIndex: 0,
      filename: 'test.mp4',
      bytesProcessed: 1024,
      totalBytes: 2048,
      percentComplete: 50
    }

    expect(progress.type).toBe('progress')
    expect(progress.percentComplete).toBe(50)
  })

  it('should validate success message structure', () => {
    const blob = new Blob(['test'], { type: 'video/mp4' })
    const success: DecryptWorkerOutput = {
      type: 'success',
      fileIndex: 0,
      filename: 'test.mp4',
      blob,
      size: blob.size
    }

    expect(success.type).toBe('success')
    expect(success.blob).toBeInstanceOf(Blob)
  })

  it('should validate error message structure', () => {
    const error: DecryptWorkerOutput = {
      type: 'error',
      fileIndex: 0,
      filename: 'test.mp4',
      error: 'Invalid key'
    }

    expect(error.type).toBe('error')
    expect(error.error).toBe('Invalid key')
  })
})

describe('Worker Decryption Logic', () => {
  const validKey = 'f626ad1ffb5159bef3e9295df34244af'

  it('should generate valid XOR pad from key', () => {
    const pad = generateXorPad(validKey)
    expect(pad).toBeInstanceOf(Uint8Array)
    expect(pad.length).toBe(4096)
  })

  it('should decrypt chunk correctly', () => {
    const pad = generateXorPad(validKey)
    const data = new Uint8Array([1, 2, 3, 4, 5])
    const encrypted = decryptChunk(data, pad, 0)
    const decrypted = decryptChunk(encrypted, pad, 0) // XOR twice = original

    expect(decrypted).toEqual(data)
  })

  it('should handle chunk offset correctly', () => {
    const pad = generateXorPad(validKey)
    const data1 = new Uint8Array([1, 2, 3])
    const data2 = new Uint8Array([4, 5, 6])

    const encrypted1 = decryptChunk(data1, pad, 0)
    const encrypted2 = decryptChunk(data2, pad, data1.length)

    const decrypted1 = decryptChunk(encrypted1, pad, 0)
    const decrypted2 = decryptChunk(encrypted2, pad, data1.length)

    expect(decrypted1).toEqual(data1)
    expect(decrypted2).toEqual(data2)
  })
})

describe('MP4 Header Validation', () => {
  it('should validate correct MP4 header', () => {
    // Valid "ftyp" box: size=20, type="ftyp"
    const header = new Uint8Array([
      0x00, 0x00, 0x00, 0x14, // box size = 20 bytes
      0x66, 0x74, 0x79, 0x70, // "ftyp"
      0x69, 0x73, 0x6f, 0x6d  // "isom" (major brand)
    ])

    expect(validateMp4Header(header)).toBe(true)
  })

  it('should reject invalid box type', () => {
    const header = new Uint8Array([
      0x00, 0x00, 0x00, 0x14,
      0x78, 0x78, 0x78, 0x78, // "xxxx" invalid
      0x00, 0x00, 0x00, 0x00
    ])

    expect(validateMp4Header(header)).toBe(false)
  })

  it('should reject header that is too short', () => {
    const header = new Uint8Array([0x00, 0x00, 0x00])
    expect(validateMp4Header(header)).toBe(false)
  })

  it('should reject invalid box size', () => {
    const header = new Uint8Array([
      0xFF, 0xFF, 0xFF, 0xFF, // size too large
      0x66, 0x74, 0x79, 0x70,
      0x00, 0x00, 0x00, 0x00
    ])

    expect(validateMp4Header(header)).toBe(false)
  })
})
