import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fetchWithRetry, api, ApiError } from '../api'

// Mock fetch
global.fetch = vi.fn()

describe('api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchWithRetry', () => {
    it('should return response on success', async () => {
      const mockResponse = new Response('{"data": "test"}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

      const result = await fetchWithRetry('https://example.com/api')
      expect(result.status).toBe(200)
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('should not retry on 4xx client errors', async () => {
      const mockResponse = new Response(
        JSON.stringify({ error: 'Bad request', code: 'INVALID_INPUT' }),
        { status: 400 }
      )
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

      await expect(fetchWithRetry('https://example.com/api')).rejects.toThrow(ApiError)
      expect(global.fetch).toHaveBeenCalledTimes(1) // No retries
    })

    it('should retry on 5xx server errors with exponential backoff', async () => {
      const mockError = new Response('Server error', { status: 500 })
      const mockSuccess = new Response('{"data": "test"}', { status: 200 })

      ;(global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockError)
        .mockResolvedValueOnce(mockError)
        .mockResolvedValueOnce(mockSuccess)

      const result = await fetchWithRetry('https://example.com/api', {
        retries: 3,
        retryDelay: 10 // Short delay for tests
      })

      expect(result.status).toBe(200)
      expect(global.fetch).toHaveBeenCalledTimes(3)
    })

    it('should throw after max retries', async () => {
      const mockError = new Response('Server error', { status: 500 })
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockError)

      await expect(
        fetchWithRetry('https://example.com/api', {
          retries: 2,
          retryDelay: 10
        })
      ).rejects.toThrow()

      expect(global.fetch).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })

    it('should handle network errors with retry', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(new Response('{"data": "test"}', { status: 200 }))

      const result = await fetchWithRetry('https://example.com/api', {
        retries: 2,
        retryDelay: 10
      })

      expect(result.status).toBe(200)
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('api.get', () => {
    it('should make GET request and parse JSON', async () => {
      const mockResponse = new Response('{"name": "test"}', { status: 200 })
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

      const result = await api.get<{ name: string }>('https://example.com/api')

      expect(result).toEqual({ name: 'test' })
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/api', {})
    })
  })

  describe('api.post', () => {
    it('should make POST request with JSON body', async () => {
      const mockResponse = new Response('{"id": "123"}', { status: 201 })
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

      const result = await api.post<{ id: string }>('https://example.com/api', {
        name: 'test'
      })

      expect(result).toEqual({ id: '123' })
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/api',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ name: 'test' })
        })
      )
    })
  })

  describe('api.put', () => {
    it('should make PUT request with JSON body', async () => {
      const mockResponse = new Response('{"updated": true}', { status: 200 })
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

      const result = await api.put<{ updated: boolean }>('https://example.com/api/123', {
        name: 'updated'
      })

      expect(result).toEqual({ updated: true })
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/api/123',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ name: 'updated' })
        })
      )
    })

    it('should merge custom headers', async () => {
      const mockResponse = new Response('{"updated": true}', { status: 200 })
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

      await api.put('https://example.com/api/123', { data: 'test' }, {
        headers: { 'X-Custom-Header': 'custom-value' }
      })

      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/api/123',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Custom-Header': 'custom-value'
          })
        })
      )
    })
  })

  describe('api.delete', () => {
    it('should make DELETE request', async () => {
      const mockResponse = new Response('{"deleted": true}', { status: 200 })
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

      const result = await api.delete<{ deleted: boolean }>('https://example.com/api/123')

      expect(result).toEqual({ deleted: true })
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/api/123',
        expect.objectContaining({
          method: 'DELETE'
        })
      )
    })

    it('should pass through options', async () => {
      const mockResponse = new Response('{"deleted": true}', { status: 200 })
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

      await api.delete('https://example.com/api/123', {
        headers: { 'Authorization': 'Bearer token' }
      })

      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/api/123',
        expect.objectContaining({
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer token' }
        })
      )
    })
  })

  describe('ApiError', () => {
    it('should contain status and code', () => {
      const error = new ApiError('Bad request', 400, 'INVALID_INPUT')

      expect(error.message).toBe('Bad request')
      expect(error.status).toBe(400)
      expect(error.code).toBe('INVALID_INPUT')
      expect(error.name).toBe('ApiError')
    })
  })
})
