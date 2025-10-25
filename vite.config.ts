import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({
    jsxRuntime: 'automatic'
  })],
  build: {
    outDir: 'dist',
    sourcemap: false,
    cssCodeSplit: false, // Ensure CSS is bundled into a single file
    minify: 'esbuild', // Use esbuild for better performance
    rollupOptions: {
      output: {
        // Bundle CSS into a single file with consistent naming
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/style-[hash].css'
          }
          return 'assets/[name]-[hash].[ext]'
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        manualChunks: {
          'react-vendor': ['react', 'react-dom']
        }
      },
    },
  },
  css: {
    postcss: './postcss.config.js',
    devSourcemap: false
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime'],
    force: true
  },
})