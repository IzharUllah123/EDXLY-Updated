import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",               // allow access from any network interface
    port: 5173,
    allowedHosts: [
      ".ngrok-free.dev",      // ✅ allows any ngrok subdomain
      ".loca.lt",             // optional: allows LocalTunnel
      "localhost",            // local dev
    ],
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ["yjs", "y-webrtc"], // ✅ keep this outside resolve
  },
}));
