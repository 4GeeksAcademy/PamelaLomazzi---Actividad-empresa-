import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  root: fileURLToPath(new URL("../../", import.meta.url)),
  publicDir: false,
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