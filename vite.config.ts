
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
      // IMPORTANT : On indique à Rollup d'ignorer ces modules pendant le build
      // car ils sont déjà gérés par l'importmap dans index.html via esm.sh
      external: [
        'react',
        'react-dom',
        'react-router-dom',
        '@google/genai',
        '@supabase/supabase-js',
        'html-to-image'
      ],
      output: {
        // On force le format ESM pour que les imports natifs fonctionnent avec l'importmap
        format: 'es'
      }
    }
  }
});
