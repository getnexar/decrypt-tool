/**
 * Web Worker factory functions
 */

/**
 * Create a decrypt worker instance
 *
 * @returns Worker instance for file decryption
 */
export function createDecryptWorker(): Worker {
  return new Worker(new URL('./decrypt.worker.ts', import.meta.url), {
    type: 'module'
  })
}

export type { DecryptWorkerInput, DecryptWorkerOutput } from './types'
