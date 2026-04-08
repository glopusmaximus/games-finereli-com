import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { writeFileSync, readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';

const buildHash = Date.now().toString(36);

function gamesPwaPlugin() {
  return {
    name: 'games-pwa',
    closeBundle() {
      // Write version.json for update detection
      writeFileSync('dist/version.json', JSON.stringify({ hash: buildHash }));

      // Inject cache version into service worker
      const swPath = join('dist', 'sw.js');
      try {
        const sw = readFileSync(swPath, 'utf-8');
        writeFileSync(swPath, sw.replace('__CACHE_VERSION__', buildHash));
      } catch {
        // sw.js might not exist yet during first builds
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), gamesPwaPlugin()],
  define: {
    __BUILD_HASH__: JSON.stringify(buildHash),
  },
});
