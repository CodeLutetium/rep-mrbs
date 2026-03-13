import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { readFileSync } from "fs"

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        proxy: {
            '/api': 'http://localhost:8080'
        }
    },
    build: {
        outDir: "dist",
    },
    define: {
        'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version),
    },
})
