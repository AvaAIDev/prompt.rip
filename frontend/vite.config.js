import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import inject from "@rollup/plugin-inject";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), nodePolyfills()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      components: path.resolve(__dirname, "./src/components"),
      pages: path.resolve(__dirname, "./src/pages"),
      templates: path.resolve(__dirname, "./src/components/templates"),
      buffer: "buffer",
    },
    extensions: [".mjs", ".js", ".jsx", ".json"],
  },
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    port: 3000,
    host: true,
  },
  optimizeDeps: {
    include: ["buffer"],
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: "globalThis",
      },
    },
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
    rollupOptions: {
      plugins: [
        inject({
          Buffer: ["buffer", "Buffer"],
        }),
      ],
    },
  },
  define: {
    "process.env": {
      VITE_SOLANA_DEVNET_RPC_URL: JSON.stringify(
        process.env.VITE_SOLANA_DEVNET_RPC_URL
      ),
      VITE_SOLANA_MAINNET_RPC_URL: JSON.stringify(
        process.env.VITE_SOLANA_MAINNET_RPC_URL
      ),
      VITE_PRIVY_APP_ID: JSON.stringify(process.env.VITE_PRIVY_APP_ID),
      VITE_MODE: JSON.stringify(process.env.VITE_MODE || process.env.NODE_ENV),
    },
    global: "window",
  },
});
