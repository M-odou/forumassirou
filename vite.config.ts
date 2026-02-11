
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // On s'assure que les variables sont toujours des chaînes valides pour éviter des erreurs de build
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL || ''),
    'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY || '')
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      // Suppression de external: [...] pour que Vite bundle tout correctement
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          utils: ['jspdf', 'html-to-image', '@supabase/supabase-js']
        }
      }
    }
  }
});
