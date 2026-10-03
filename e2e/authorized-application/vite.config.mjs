import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
const backend = process.env.ILP_AUTHORIZED_H2_URL;
if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(backend ?? '')) throw new Error('Synthetic loopback backend required');
export default defineConfig({ plugins: [react()], server: { host: '127.0.0.1', port: 5181, strictPort: true, proxy: { '/api': backend, '/test': backend } } });
