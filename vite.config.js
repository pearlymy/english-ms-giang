import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Dùng tên repository vì bạn dùng link mặc định của GitHub Pages
  base: '/english-ms-giang/',
})
