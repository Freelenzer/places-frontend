import { defineConfig } from "vite";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: resolve(__dirname, "index.html"),
    },
  },
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/app': {
        target: 'http://app:8080', // service name in docker-compose
        changeOrigin: true,
      },
    },
  },
});
