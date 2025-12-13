import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'auth/index': 'src/auth/index.ts',
    'workflow/index': 'src/workflow/index.ts',
    'plugin/index': 'src/plugin/index.ts',
    'knowledge/index': 'src/knowledge/index.ts',
    'db/index': 'src/db/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  external: ['postgres', 'argon2'],
});
