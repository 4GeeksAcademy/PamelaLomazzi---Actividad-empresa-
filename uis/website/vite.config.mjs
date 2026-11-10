import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  root: fileURLToPath(new URL("../../", import.meta.url)),
  publicDir: fileURLToPath(new URL("../../imagenes", import.meta.url)),
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL("../../index.html", import.meta.url)),
        apply: fileURLToPath(new URL("../../apply.html", import.meta.url)),
      },
    },
  },
  server: {
    allowedHosts: [".app.github.dev", ".githubpreview.dev"],
    watch: {
      usePolling: process.env.CHOKIDAR_USEPOLLING === "true",
      ignored: ["**/uis/talent-pipeline-tracker/**"],
    },
    fs: {
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "**/uis/talent-pipeline-tracker/**", "**/services/**"],
    },
  },
});