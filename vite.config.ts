
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
    'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL),
    'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY)
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react-router-dom',
        '@google/genai',
        '@supabase/supabase-js',
        'html-to-image',
        'jspdf'
      ],
      output: {
        format: 'es'
      }
    }
  }
});
