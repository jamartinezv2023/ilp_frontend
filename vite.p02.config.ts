import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
export default defineConfig({ plugins: [react(), {
  name: 'p02-isolated-offline', apply: 'build', enforce: 'post',
  generateBundle(_, bundle) {
    const files = Object.keys(bundle).filter(name => name === 'p02.html' || name.startsWith('assets/')).map(name => `/${name}`);
    if (!files.includes('/p02.html')) throw new Error('P02_HTML_MISSING');
    const template = readFileSync(new URL('./e2e/p02/worker.template.js', import.meta.url), 'utf8');
    const version = createHash('sha256').update(template + JSON.stringify(files)).digest('hex').slice(0,16);
    const source = template.replace('__CACHE_NAME__', JSON.stringify(`ilp-p02-lab-${version}`)).replace('__FILES__', JSON.stringify(files));
    this.emitFile({ type: 'asset', fileName: 'p02-worker.js', source });
  },
}], build: { outDir: 'dist-p02', rollupOptions: { input: 'p02.html' } } });
