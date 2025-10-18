import React, { useEffect, useState } from 'react';

interface PerformanceMetrics {
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte
  loadTime: number | null;
  bundleSize: number | null;
}

export const PerformanceMonitor: React.FC<{
  enabled?: boolean;
  onMetrics?: (metrics: PerformanceMetrics) => void;
}> = ({ enabled = process.env.NODE_ENV === 'development', onMetrics }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    loadTime: null,
    bundleSize: null,
  });

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const measurePerformance = () => {
      const newMetrics: PerformanceMetrics = { ...metrics };

      // Measure page load time
      if (performance.timing) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        newMetrics.loadTime = loadTime;
        newMetrics.ttfb = performance.timing.responseStart - performance.timing.navigationStart;
      }

      // Measure Core Web Vitals
      if ('PerformanceObserver' in window) {
        // First Contentful Paint
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
          if (fcpEntry) {
            newMetrics.fcp = fcpEntry.startTime;
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });

        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            newMetrics.lcp = lastEntry.startTime;
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.processingStart && entry.startTime) {
              newMetrics.fid = entry.processingStart - entry.startTime;
            }
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          newMetrics.cls = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      }

      // Estimate bundle size
      if (performance.getEntriesByType) {
        const resources = performance.getEntriesByType('resource');
        const jsResources = resources.filter(resource => 
          resource.name.includes('.js') && !resource.name.includes('node_modules')
        );
        const totalSize = jsResources.reduce((total, resource: any) => {
          return total + (resource.transferSize || 0);
        }, 0);
        newMetrics.bundleSize = totalSize;
      }

      setMetrics(newMetrics);
      onMetrics?.(newMetrics);

      // Log metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.group('🚀 Performance Metrics');
        console.log('First Contentful Paint:', newMetrics.fcp ? `${newMetrics.fcp.toFixed(2)}ms` : 'N/A');
        console.log('Largest Contentful Paint:', newMetrics.lcp ? `${newMetrics.lcp.toFixed(2)}ms` : 'N/A');
        console.log('First Input Delay:', newMetrics.fid ? `${newMetrics.fid.toFixed(2)}ms` : 'N/A');
        console.log('Cumulative Layout Shift:', newMetrics.cls ? newMetrics.cls.toFixed(4) : 'N/A');
        console.log('Time to First Byte:', newMetrics.ttfb ? `${newMetrics.ttfb.toFixed(2)}ms` : 'N/A');
        console.log('Page Load Time:', newMetrics.loadTime ? `${newMetrics.loadTime.toFixed(2)}ms` : 'N/A');
        console.log('Bundle Size:', newMetrics.bundleSize ? `${(newMetrics.bundleSize / 1024).toFixed(2)}KB` : 'N/A');
        console.groupEnd();
      }
    };

    // Measure after page load
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
    }

    // Measure again after a delay to catch LCP
    const timeoutId = setTimeout(measurePerformance, 2000);

    return () => {
      window.removeEventListener('load', measurePerformance);
      clearTimeout(timeoutId);
    };
  }, [enabled, onMetrics]);

  // Don't render anything in production
  if (!enabled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded-lg font-mono z-50 max-w-xs">
      <div className="font-bold mb-1">Performance</div>
      <div>FCP: {metrics.fcp ? `${metrics.fcp.toFixed(0)}ms` : 'N/A'}</div>
      <div>LCP: {metrics.lcp ? `${metrics.lcp.toFixed(0)}ms` : 'N/A'}</div>
      <div>FID: {metrics.fid ? `${metrics.fid.toFixed(0)}ms` : 'N/A'}</div>
      <div>CLS: {metrics.cls ? metrics.cls.toFixed(3) : 'N/A'}</div>
      <div>Load: {metrics.loadTime ? `${metrics.loadTime.toFixed(0)}ms` : 'N/A'}</div>
      <div>Bundle: {metrics.bundleSize ? `${(metrics.bundleSize / 1024).toFixed(0)}KB` : 'N/A'}</div>
    </div>
  );
};

// Hook for performance monitoring
export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    loadTime: null,
    bundleSize: null,
  });

  const updateMetrics = (newMetrics: PerformanceMetrics) => {
    setMetrics(newMetrics);
  };

  const getScore = (metric: keyof PerformanceMetrics): 'good' | 'needs-improvement' | 'poor' => {
    const value = metrics[metric];
    if (value === null) return 'poor';

    switch (metric) {
      case 'fcp':
        return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
      case 'lcp':
        return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
      case 'fid':
        return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
      case 'cls':
        return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
      case 'ttfb':
        return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
      default:
        return 'poor';
    }
  };

  const getOverallScore = (): 'good' | 'needs-improvement' | 'poor' => {
    const scores = ['fcp', 'lcp', 'fid', 'cls'].map(metric => getScore(metric as keyof PerformanceMetrics));
    
    if (scores.every(score => score === 'good')) return 'good';
    if (scores.some(score => score === 'poor')) return 'poor';
    return 'needs-improvement';
  };

  return {
    metrics,
    updateMetrics,
    getScore,
    getOverallScore,
  };
};

export default PerformanceMonitor;