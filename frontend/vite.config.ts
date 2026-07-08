import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsConfigPaths()],
  server: {
    proxy: {
      "/cdn": {
        target: "https://d2tqc45o39v2m3.cloudfront.net",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/cdn/, ""),
      },
    },
  },
});
