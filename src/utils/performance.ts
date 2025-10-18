/**
 * Performance monitoring utilities
 */

// Performance metrics tracking
export class PerformanceMonitor {
  private static metrics: Map<string, number> = new Map()
  private static observers: PerformanceObserver[] = []

  static startTiming(label: string): void {
    this.metrics.set(label, performance.now())
  }

  static endTiming(label: string): number {
    const startTime = this.metrics.get(label)
    if (!startTime) {
      console.warn(`No start time found for ${label}`)
      return 0
    }
    
    const duration = performance.now() - startTime
    this.metrics.delete(label)
    
    // Log slow operations
    if (duration > 100) {
      console.warn(`Slow operation detected: ${label} took ${duration.toFixed(2)}ms`)
    }
    
    return duration
  }

  static measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.startTiming(label)
    return fn().finally(() => {
      this.endTiming(label)
    })
  }

  static measureSync<T>(label: string, fn: () => T): T {
    this.startTiming(label)
    const result = fn()
    this.endTiming(label)
    return result
  }

  static getWebVitals(): Promise<{
    fcp: number | null
    lcp: number | null
    fid: number | null
    cls: number | null
  }> {
    return new Promise((resolve) => {
      const vitals: any = {
        fcp: null,
        lcp: null,
        fid: null,
        cls: null,
      }

      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint')
        if (fcpEntry) {
          vitals.fcp = fcpEntry.startTime
        }
      })
      fcpObserver.observe({ entryTypes: ['paint'] })

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        if (lastEntry) {
          vitals.lcp = lastEntry.startTime
        }
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const fidEntry = entries[0]
        if (fidEntry) {
          vitals.fid = fidEntry.processingStart - fidEntry.startTime
        }
      })
      fidObserver.observe({ entryTypes: ['first-input'] })

      // Cumulative Layout Shift
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        vitals.cls = clsValue
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })

      // Resolve after 5 seconds to allow metrics to collect
      setTimeout(() => {
        fcpObserver.disconnect()
        lcpObserver.disconnect()
        fidObserver.disconnect()
        clsObserver.disconnect()
        resolve(vitals)
      }, 5000)
    })
  }

  static reportMetrics(): void {
    this.getWebVitals().then((vitals) => {
      console.log('Web Vitals:', vitals)
      
      // Send to analytics service
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'web_vitals', {
          event_category: 'Performance',
          event_label: 'Core Web Vitals',
          value: Math.round(vitals.lcp || 0),
          custom_map: {
            fcp: vitals.fcp,
            lcp: vitals.lcp,
            fid: vitals.fid,
            cls: vitals.cls,
          },
        })
      }
    })
  }
}

// Image lazy loading utility
export const lazyLoadImage = (img: HTMLImageElement, src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

// Debounce utility for performance
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle utility for performance
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Memory usage monitoring
export const getMemoryUsage = (): {
  used: number
  total: number
  percentage: number
} => {
  if ('memory' in performance) {
    const memory = (performance as any).memory
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
    }
  }
  return { used: 0, total: 0, percentage: 0 }
}

// Bundle size analyzer
export const analyzeBundleSize = (): void => {
  if (process.env.NODE_ENV === 'development') {
    const scripts = document.querySelectorAll('script[src]')
    let totalSize = 0
    
    scripts.forEach((script) => {
      const src = script.getAttribute('src')
      if (src) {
        fetch(src)
          .then(response => response.blob())
          .then(blob => {
            totalSize += blob.size
            console.log(`Script ${src}: ${(blob.size / 1024).toFixed(2)}KB`)
          })
          .catch(() => {})
      }
    })
    
    setTimeout(() => {
      console.log(`Total bundle size: ${(totalSize / 1024).toFixed(2)}KB`)
    }, 1000)
  }
}
