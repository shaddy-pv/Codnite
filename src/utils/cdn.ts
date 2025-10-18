/**
 * CDN integration utilities
 */

export interface CDNConfig {
  baseUrl: string
  apiKey?: string
  region?: string
  version?: string
}

export class CDNManager {
  private config: CDNConfig

  constructor(config: CDNConfig) {
    this.config = config
  }

  // Upload file to CDN
  async uploadFile(file: File, path: string): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('path', path)

    try {
      const response = await fetch(`${this.config.baseUrl}/upload`, {
        method: 'POST',
        headers: {
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()
      return result.url
    } catch (error) {
      console.error('CDN upload error:', error)
      throw error
    }
  }

  // Get optimized image URL
  getOptimizedImageUrl(
    originalUrl: string,
    options: {
      width?: number
      height?: number
      quality?: number
      format?: 'webp' | 'jpeg' | 'png'
      fit?: 'cover' | 'contain' | 'fill'
    } = {}
  ): string {
    const params = new URLSearchParams()
    
    if (options.width) params.append('w', options.width.toString())
    if (options.height) params.append('h', options.height.toString())
    if (options.quality) params.append('q', options.quality.toString())
    if (options.format) params.append('f', options.format)
    if (options.fit) params.append('fit', options.fit)

    const queryString = params.toString()
    return `${this.config.baseUrl}/image/${encodeURIComponent(originalUrl)}${queryString ? `?${queryString}` : ''}`
  }

  // Preload critical resources
  async preloadResources(urls: string[]): Promise<void> {
    const promises = urls.map(url => {
      return new Promise<void>((resolve) => {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.href = url
        link.onload = () => resolve()
        link.onerror = () => resolve() // Don't fail on error
        document.head.appendChild(link)
      })
    })

    await Promise.all(promises)
  }

  // Get CDN URL with version
  getVersionedUrl(path: string): string {
    const version = this.config.version || 'v1'
    return `${this.config.baseUrl}/${version}/${path}`
  }

  // Batch upload files
  async batchUpload(files: { file: File; path: string }[]): Promise<string[]> {
    const promises = files.map(({ file, path }) => this.uploadFile(file, path))
    return Promise.all(promises)
  }

  // Delete file from CDN
  async deleteFile(path: string): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify({ path }),
      })

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`)
      }
    } catch (error) {
      console.error('CDN delete error:', error)
      throw error
    }
  }
}

// Image optimization utilities
export const imageOptimization = {
  // Generate responsive image URLs
  generateResponsiveUrls(baseUrl: string, sizes: number[]): string[] {
    return sizes.map(size => 
      `${baseUrl}?w=${size}&q=80&f=webp`
    )
  },

  // Create srcset for responsive images
  createSrcSet(baseUrl: string, sizes: number[]): string {
    return sizes
      .map(size => `${baseUrl}?w=${size}&q=80&f=webp ${size}w`)
      .join(', ')
  },

  // Lazy load images
  lazyLoadImage(img: HTMLImageElement, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            img.src = src
            img.onload = () => resolve()
            img.onerror = reject
            observer.unobserve(img)
          }
        })
      })
      
      observer.observe(img)
    })
  }
}

// Asset optimization
export const assetOptimization = {
  // Minify CSS
  minifyCSS(css: string): string {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/;\s*}/g, '}') // Remove semicolon before closing brace
      .replace(/\s*{\s*/g, '{') // Remove spaces around opening brace
      .replace(/;\s*/g, ';') // Remove spaces after semicolon
      .trim()
  },

  // Minify JavaScript
  minifyJS(js: string): string {
    return js
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*$/gm, '') // Remove line comments
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/;\s*}/g, '}') // Remove semicolon before closing brace
      .replace(/\s*{\s*/g, '{') // Remove spaces around opening brace
      .replace(/;\s*/g, ';') // Remove spaces after semicolon
      .trim()
  },

  // Compress JSON
  compressJSON(obj: any): string {
    return JSON.stringify(obj)
  }
}

// Resource hints
export const resourceHints = {
  // Add DNS prefetch
  addDNSPrefetch(domain: string): void {
    const link = document.createElement('link')
    link.rel = 'dns-prefetch'
    link.href = `//${domain}`
    document.head.appendChild(link)
  },

  // Add preconnect
  addPreconnect(url: string): void {
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = url
    document.head.appendChild(link)
  },

  // Add prefetch
  addPrefetch(url: string): void {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = url
    document.head.appendChild(link)
  },

  // Add preload
  addPreload(url: string, as: string): void {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = url
    link.as = as
    document.head.appendChild(link)
  }
}

// Default CDN configuration
export const defaultCDNConfig: CDNConfig = {
  baseUrl: process.env.REACT_APP_CDN_URL || 'https://cdn.codnite.com',
  region: 'us-east-1',
  version: 'v1'
}
