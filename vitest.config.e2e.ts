import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.e2e-spec.ts'],
    // Cria um schema isolado no Postgres para cada arquivo de teste
    setupFiles: ['./src/test/setup-e2e.ts'],
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    // SWC emite a metadata dos decorators (o esbuild não), necessário para a DI do Nest
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
})
