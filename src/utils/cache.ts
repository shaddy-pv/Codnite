/**
 * Caching utilities for performance optimization
 */

export interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum number of items
  storage?: 'memory' | 'localStorage' | 'sessionStorage'
}

export class Cache<T = any> {
  private cache = new Map<string, { value: T; expires: number }>()
  private options: Required<CacheOptions>

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 5 * 60 * 1000, // 5 minutes default
      maxSize: options.maxSize || 100,
      storage: options.storage || 'memory',
    }
  }

  set(key: string, value: T): void {
    const expires = Date.now() + this.options.ttl
    
    // Remove expired entries
    this.cleanup()
    
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.options.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(key, { value, expires })
    
    // Persist to storage if configured
    if (this.options.storage !== 'memory') {
      this.persistToStorage(key, { value, expires })
    }
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      // Try to load from storage
      if (this.options.storage !== 'memory') {
        const stored = this.loadFromStorage(key)
        if (stored) {
          this.cache.set(key, stored)
          return stored.value
        }
      }
      return null
    }
    
    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    
    return item.value
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    
    if (this.options.storage !== 'memory') {
      this.removeFromStorage(key)
    }
    
    return deleted
  }

  clear(): void {
    this.cache.clear()
    
    if (this.options.storage !== 'memory') {
      this.clearStorage()
    }
  }

  size(): number {
    this.cleanup()
    return this.cache.size
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key)
      }
    }
  }

  private persistToStorage(key: string, item: { value: T; expires: number }): void {
    try {
      const storage = this.options.storage === 'localStorage' ? localStorage : sessionStorage
      storage.setItem(`cache_${key}`, JSON.stringify(item))
    } catch (error) {
      console.warn('Failed to persist cache to storage:', error)
    }
  }

  private loadFromStorage(key: string): { value: T; expires: number } | null {
    try {
      const storage = this.options.storage === 'localStorage' ? localStorage : sessionStorage
      const stored = storage.getItem(`cache_${key}`)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error)
    }
    return null
  }

  private removeFromStorage(key: string): void {
    try {
      const storage = this.options.storage === 'localStorage' ? localStorage : sessionStorage
      storage.removeItem(`cache_${key}`)
    } catch (error) {
      console.warn('Failed to remove cache from storage:', error)
    }
  }

  private clearStorage(): void {
    try {
      const storage = this.options.storage === 'localStorage' ? localStorage : sessionStorage
      const keys = Object.keys(storage).filter(key => key.startsWith('cache_'))
      keys.forEach(key => storage.removeItem(key))
    } catch (error) {
      console.warn('Failed to clear cache storage:', error)
    }
  }
}

// Global cache instances
export const apiCache = new Cache({ ttl: 2 * 60 * 1000, maxSize: 50 }) // 2 minutes
export const userCache = new Cache({ ttl: 10 * 60 * 1000, maxSize: 20 }) // 10 minutes
export const imageCache = new Cache({ ttl: 30 * 60 * 1000, maxSize: 100 }) // 30 minutes

// Cache decorator for functions
export function cached<T extends (...args: any[]) => any>(
  fn: T,
  options: CacheOptions = {}
): T {
  const cache = new Cache(options)
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)
    const cached = cache.get(key)
    
    if (cached !== null) {
      return cached
    }
    
    const result = fn(...args)
    
    // Handle promises
    if (result instanceof Promise) {
      return result.then((value) => {
        cache.set(key, value)
        return value
      })
    }
    
    cache.set(key, result)
    return result
  }) as T
}

// Image preloading utility
export const preloadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Preload multiple images
export const preloadImages = async (srcs: string[]): Promise<HTMLImageElement[]> => {
  const promises = srcs.map(src => preloadImage(src))
  return Promise.all(promises)
}

// Resource hints for performance
export const addResourceHints = (urls: string[]): void => {
  urls.forEach(url => {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = url
    document.head.appendChild(link)
  })
}

// Service Worker registration for caching
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered:', registration)
      return registration
    } catch (error) {
      console.warn('Service Worker registration failed:', error)
      return null
    }
  }
  return null
}
