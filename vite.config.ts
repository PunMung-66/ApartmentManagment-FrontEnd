import path from "path"
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const apiBaseUrl = env.VITE_API_BASE_URL || "/api"
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || "http://localhost:8080"

  return {
    plugins: [react()],
    server: {
      proxy: {
        [apiBaseUrl]: {
          target: apiProxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(new RegExp(`^${apiBaseUrl}`), ""),
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})
