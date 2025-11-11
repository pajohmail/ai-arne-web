import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-htaccess',
      closeBundle() {
        // Skapa .htaccess i dist/ om den inte finns
        const distHtaccess = join(__dirname, 'dist', '.htaccess');
        if (!existsSync(distHtaccess)) {
          const htaccessContent = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Tillåt direkta filer (assets, config.json, etc.)
  RewriteCond %{REQUEST_FILENAME} -f
  RewriteRule ^ - [L]
  
  # Tillåt direkta kataloger
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  
  # Redirect alla andra requests till index.html (för SPA routing)
  RewriteRule ^ index.html [L]
</IfModule>

# Sätt rätt MIME types för JavaScript-moduler
<IfModule mod_mime.c>
  AddType application/javascript js
  AddType text/css css
  AddType application/json json
</IfModule>
`;
          writeFileSync(distHtaccess, htaccessContent);
        }
      },
    },
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});


