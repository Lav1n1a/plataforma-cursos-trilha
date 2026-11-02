import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    test: {
        environment: 'node',
        // Os testes antigos usam node:test; esta suíte é somente de eventos.
        include: ['test/eventos/**/*.test.ts'],
        setupFiles: ['./test/eventos/setup.ts'],
        restoreMocks: true,
        clearMocks: true,
    },
});
