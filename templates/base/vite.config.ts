import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Stay'Core PMS proxy: dev requests to /pms-api are forwarded to api.stay-core.com.
// In production, the build calls the API directly — the origin must be whitelisted
// on the org's BookingEngineConfig.allowed_origins (or via custom_domain).
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/pms-api': {
        target: 'https://api.stay-core.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/pms-api/, ''),
      },
    },
  },
});
