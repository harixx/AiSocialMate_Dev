import { build } from 'esbuild';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

// Get production dependencies to mark as external
const externalDeps = Object.keys(packageJson.dependencies || {});

await build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  outdir: 'dist',
  format: 'esm',
  platform: 'node',
  target: 'node20',
  external: [
    ...externalDeps,
    // Explicitly exclude vite and dev dependencies
    'vite',
    '@vitejs/plugin-react',
    'drizzle-kit',
    'tsx',
    'typescript',
    '@replit/vite-plugin-cartographer',
    '@replit/vite-plugin-runtime-error-modal'
  ],
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  // Handle dynamic imports properly
  splitting: false,
  // Don't bundle node_modules
  packages: 'external'
});

console.log('✅ Server build completed');