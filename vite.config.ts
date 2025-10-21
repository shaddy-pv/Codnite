import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
    // Bundle analyzer
    visualizer({
      filename: 'dist/bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild', // Use esbuild instead of terser for better memory usage
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React ecosystem
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor'
          }
          
          // Router
          if (id.includes('react-router')) {
            return 'router'
          }
          
          // UI libraries
          if (id.includes('lucide-react')) {
            return 'icons'
          }
          
          // Utilities
          if (id.includes('axios') || id.includes('lodash') || id.includes('date-fns')) {
            return 'utils'
          }
          
          // Rich text editor (heavy)
          if (id.includes('@tiptap')) {
            return 'editor'
          }
          
          // Charts and visualization
          if (id.includes('chart') || id.includes('d3') || id.includes('recharts')) {
            return 'charts'
          }
          
          // Socket.io
          if (id.includes('socket.io')) {
            return 'socket'
          }
          
          // Pages (route-based splitting)
          if (id.includes('/pages/')) {
            const pageName = id.split('/pages/')[1].split('/')[0]
            return `page-${pageName}`
          }
          
          // Components
          if (id.includes('/components/')) {
            return 'components'
          }
          
          // Default vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash].${ext}`
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash].${ext}`
          }
          return `assets/[name]-[hash].${ext}`
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase warning limit
    target: 'es2015',
    cssCodeSplit: true,
  },
  server: {
    port: 5173,
    host: true,
    hmr: {
      overlay: false, // Disable error overlay to prevent full reloads
      port: 24678, // Use different port for HMR
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 4173,
    host: true,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'fast-deep-equal',
      '@tiptap/suggestion',
      '@tiptap/extension-mention',
    ],
    exclude: [],
  },
  esbuild: {
    target: 'es2015',
  },
  resolve: {
    alias: {
      'fast-deep-equal/es6/react.js': 'fast-deep-equal',
      'fast-deep-equal/es6': 'fast-deep-equal',
      '@tiptap/suggestion': '@tiptap/suggestion',
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
})
