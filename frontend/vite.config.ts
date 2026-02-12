import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // ✅ ngrok 같은 외부 도메인 접속 허용
    // (임시 피드백용이면 allowedHosts: "all" 이 제일 편함)
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "ester-parsonic-iconically.ngrok-free.dev",
    ],

    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/media": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});