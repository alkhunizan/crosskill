import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  envPrefix: ["VITE_", "TAURI_"],
  resolve: {
    alias: {
      // Always pull the browser-targeted bundle of @crosskill/core so we
      // don't end up requiring node:module/createRequire in the webview.
      "@crosskill/core$": resolve(
        here,
        "../../packages/core/dist/browser/index.js"
      ),
    },
  },
  build: {
    target: ["es2021", "chrome105", "safari14"],
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
});
