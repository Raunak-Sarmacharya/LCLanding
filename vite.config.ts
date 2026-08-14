import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api/external/locations': {
        target: 'https://chef.localcooks.ca',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/external\/locations/, '/api/public/locations')
      },
      '/api/external/kitchens': {
        target: 'https://chef.localcooks.ca',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/external\/kitchens/, '/api/public/kitchens')
      },
      '/api/external/shops': {
        target: 'https://shop.localcook.shop',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/external\/shops/, '/api-featured-shops.php')
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react/jsx-runtime',
      '@tiptap/react',
      '@tiptap/starter-kit',
      '@tiptap/extension-mention',
      '@tiptap/markdown',
      '@tiptap/suggestion',
      'tippy.js',
    ],
    exclude: ['@tiptap/pm'], // Exclude peer dependency that causes resolution issues
    force: false, // Set to true if you need to force re-optimization
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-gsap': ['gsap'],
          'vendor-motion': ['motion/react'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-tiptap': [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-mention',
            '@tiptap/markdown',
            '@tiptap/suggestion',
            'tippy.js',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase limit to 1MB
  },
})


