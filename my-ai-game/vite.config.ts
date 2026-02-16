import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward /wix-openai/v1 requests to Wix OpenAI API
      '/wix-openai/v1': {
        target: 'https://www.wixapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/wix-openai\/v1/, '/openai/v1'),
        secure: true,
      },
    },
  },
})
