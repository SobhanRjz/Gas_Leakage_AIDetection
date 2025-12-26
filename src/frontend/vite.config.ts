import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env from the current directory (frontend dir)
  const env = loadEnv(mode, "../../", "");
  return {
    plugins: [react()],
    base: env.VITE_BASE || "/",
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
  };
});