import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // sockjs-client 가 Node 의 global 을 참조해 브라우저에서 흰 화면이 납니다
    global: 'globalThis',
  },
  server: {
    port: 5173,
  },
  optimizeDeps: {
    include: ['sockjs-client', '@stomp/stompjs'],
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
