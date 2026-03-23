import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

import path from "path";

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        viteStaticCopy({
            targets: [
                {
                    src: "node_modules/tinymce/**/*",
                    dest: "tinymce",
                },
            ],
        }),
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    assetsInclude: ["**/*.png", "**/*.jpg", "**/*.svg", "**/*.otf", "**/*.ttf"], // file ảnh, font
    server: {
        host: true,
        allowedHosts: [".irdop.org"],
    },
    preview: {
        host: true, // or '0.0.0.0' for all interfaces
        port: 4173,
        allowedHosts: [".irdop.org"],
    },
    build: {
        chunkSizeWarningLimit: 1500, // Increase limit to 1.5MB to stay quiet
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes("node_modules")) {
                        return "vendor"; // Put all dependencies in one vendor chunk
                    }
                },
            },
        },
    },
});
