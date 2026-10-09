import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { vendorChunk } from "./config/vendorChunks";
export default defineConfig({
  plugins: [react(), {
    name: "r9-locked-offline-shell", apply: "build", enforce: "post",
    generateBundle(_, bundle) {
      const files = Object.keys(bundle).filter(name => name === "r9.html" || name.startsWith("assets/")).map(name => `/${name}`);
      if (!files.includes("/r9.html")) throw new Error("R9_HTML_MISSING");
      const template = readFileSync(new URL("./e2e/p02/worker.template.js", import.meta.url), "utf8");
      const version = createHash("sha256").update(template + JSON.stringify(files) + JSON.stringify(bundle["r9.html"])).digest("hex").slice(0, 16);
      const source = template.replaceAll("__CACHE_NAME__", JSON.stringify(`ilp-r9-shell-${version}`))
        .replaceAll("__FILES__", JSON.stringify(files))
        .replaceAll("__CACHE_PREFIX__", JSON.stringify("ilp-r9-shell-"))
        .replaceAll("__VERIFY_MESSAGE__", JSON.stringify("R9_VERIFY_CACHE"));
      this.emitFile({ type: "asset", fileName: "r9-worker.js", source });
    },
  }],
  server: { host: "127.0.0.1", port: 15179, strictPort: true, proxy: {
    "/auth": { target: "http://127.0.0.1:18083" },
    "/api": { target: "http://127.0.0.1:18084" },
  } },
  build: { outDir: "dist-r9", rollupOptions: { input: "r9.html", output: { manualChunks: vendorChunk } } },
  preview: { host: "127.0.0.1", port: 15179, strictPort: true, proxy: {
    "/auth": { target: "http://127.0.0.1:18083" },
    "/api": { target: "http://127.0.0.1:18084" },
  } },
});
