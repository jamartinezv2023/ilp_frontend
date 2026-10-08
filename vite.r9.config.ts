import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: { host: "127.0.0.1", port: 15179, strictPort: true, proxy: {
    "/auth": { target: "http://127.0.0.1:18083" },
    "/api": { target: "http://127.0.0.1:18084" },
  } },
  build: { outDir: "dist-r9", rollupOptions: { input: "r9.html" } },
  preview: { host: "127.0.0.1", port: 15179, strictPort: true, proxy: {
    "/auth": { target: "http://127.0.0.1:18083" },
    "/api": { target: "http://127.0.0.1:18084" },
  } },
});
