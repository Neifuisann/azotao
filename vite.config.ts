import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import type { ProxyOptions } from 'vite'
import type { IncomingMessage, ServerResponse } from 'http'

// https://vite.dev/config/
export default defineConfig(async () => {
  const tailwindcss = await import("@tailwindcss/vite").then(m => m.default || m);
  
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          rewrite: (path: string) => path,
          configure: (proxy: any, _options: ProxyOptions) => {
            proxy.on('error', (err: Error, _req: IncomingMessage, _res: ServerResponse) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq: any, req: IncomingMessage, _res: ServerResponse) => {
              //console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes: any, req: IncomingMessage, _res: ServerResponse) => {
              //console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        },
      },
    },
  }
})
