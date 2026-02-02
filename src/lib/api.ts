interface FetchOptions extends RequestInit {
  retries?: number
  retryDelay?: number
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Fetch with automatic retry logic for transient failures
 * Retries server errors (5xx) with exponential backoff
 * Does not retry client errors (4xx)
 */
export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { retries = 3, retryDelay = 1000, ...fetchOptions } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions)

      if (response.ok) {
        return response
      }

      // Don't retry client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        const data = await response.json().catch(() => ({}))
        throw new ApiError(
          data.error || `Request failed with status ${response.status}`,
          response.status,
          data.code
        )
      }

      // Server errors (5xx) - retry
      throw new Error(`Server error: ${response.status}`)
    } catch (error) {
      lastError = error as Error

      // Don't retry ApiError (client errors)
      if (error instanceof ApiError) {
        throw error
      }

      // Retry with exponential backoff
      if (attempt < retries) {
        const delay = retryDelay * Math.pow(2, attempt)
        await new Promise((r) => setTimeout(r, delay))
      }
    }
  }

  throw lastError || new Error('Request failed')
}

/**
 * Convenience API methods with retry logic built-in
 */
export const api = {
  async get<T>(url: string, options?: FetchOptions): Promise<T> {
    const response = await fetchWithRetry(url, options)
    return response.json()
  },

  async post<T>(url: string, data: unknown, options?: FetchOptions): Promise<T> {
    const response = await fetchWithRetry(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: JSON.stringify(data)
    })
    return response.json()
  },

  async put<T>(url: string, data: unknown, options?: FetchOptions): Promise<T> {
    const response = await fetchWithRetry(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: JSON.stringify(data)
    })
    return response.json()
  },

  async delete<T>(url: string, options?: FetchOptions): Promise<T> {
    const response = await fetchWithRetry(url, {
      ...options,
      method: 'DELETE'
    })
    return response.json()
  }
}
