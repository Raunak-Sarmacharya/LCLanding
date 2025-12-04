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
  optimizeDeps: {
    include: [
      '@tiptap/react',
      '@tiptap/starter-kit',
      '@tiptap/extension-mention',
      '@tiptap/markdown',
      '@tiptap/suggestion',
      'tippy.js',
    ],
    exclude: ['@tiptap/pm'], // Exclude peer dependency that causes resolution issues
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


