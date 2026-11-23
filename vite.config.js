import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { handleChat } from './server/chat.js'

const apiPlugin = {
  name: 'cortexai-api',
  configureServer(server) {
    server.middlewares.use('/api/chat', (req, res, next) => {
      handleChat(req, res).catch(next)
    })
  },
  configurePreviewServer(server) {
    server.middlewares.use('/api/chat', (req, res, next) => {
      handleChat(req, res).catch(next)
    })
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiPlugin],
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4174 },
})
