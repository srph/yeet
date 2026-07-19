import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const appHost = new URL(env.APP_URL || 'http://localhost:8000').hostname;

    return {
        plugins: [
            laravel({
                input: ['resources/css/app.css', 'resources/js/app.tsx'],
                refresh: true,
            }),
            react(),
            tailwindcss(),
        ],
        server: {
            // Bind all interfaces; advertise APP_URL's host so the browser
            // doesn't try to fetch assets from http://0.0.0.0:5173.
            host: '0.0.0.0',
            hmr: {
                host: appHost,
            },
            watch: {
                ignored: ['**/storage/framework/views/**'],
            },
        },
    };
});
