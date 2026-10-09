import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { vendorChunk } from "./config/vendorChunks";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: vendorChunk,
      },
    },
  },
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
  },
});
