import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Dùng '/' vì bạn đang sử dụng tên miền riêng (Custom Domain)
  base: '/',
})
