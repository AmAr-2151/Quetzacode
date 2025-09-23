import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: '0.0.0.0', // ✅ Acepta conexiones de cualquier IP
    strictPort: true, // ✅ Falla si el puerto no está disponible
    open: true // ✅ Abre el navegador automáticamente
  },
  preview: {
    port: 3001,
    host: '0.0.0.0'
  }
})