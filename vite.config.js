import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

const PRIMARY = "https://medilink-back-repo-1.onrender.com";
const FALLBACK = "https://tiny-colts-feel.loca.lt";

async function getTarget() {
  try {
    const res = await fetch(`${PRIMARY}/health`, {
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      console.log("✅ Proxy → Primary server");
      return PRIMARY;
    }
  } catch {
    console.warn("⚠️ Primary down, using fallback...");
  }
  console.log("🔄 Proxy → Fallback server");
  return FALLBACK;
}

const target = await getTarget();

export default defineConfig({
  logLevel: 'error',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: target,
        changeOrigin: true,
        secure: true,
        headers: {
          "ngrok-skip-browser-warning": "true"
        }
      },
    },
  },
});