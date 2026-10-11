import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// In development the API is reached through Vite's proxy, so the browser sees ONE origin.
// That keeps the SameSite=Strict refresh cookie working with no CORS setup.
const proxyTarget = process.env.VITE_PROXY_TARGET ?? "http://localhost:5000";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
    server: { port: 5173, proxy: { "/api": { target: proxyTarget, changeOrigin: false } } },
    preview: { port: 4173, proxy: { "/api": { target: proxyTarget, changeOrigin: false } } },
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./tests/setup.ts"],
        include: ["tests/**/*.test.{ts,tsx}"],
        css: false,
    },
});
