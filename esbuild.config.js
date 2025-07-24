import { build } from 'esbuild';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

// Production dependencies that should be external
const productionDeps = Object.keys(packageJson.dependencies || {});

// Development dependencies that should NEVER be bundled
const devDependencies = [
  'vite',
  '@vitejs/plugin-react',
  'drizzle-kit',
  'tsx',
  'typescript',
  '@replit/vite-plugin-cartographer',
  '@replit/vite-plugin-runtime-error-modal',
  '@tailwindcss/vite',
  '@tailwindcss/typography',
  'autoprefixer',
  'postcss',
  'tailwindcss',
  'tailwindcss-animate'
];

export const buildConfig = {
  entryPoints: ['server/index.ts'],
  bundle: true,
  outdir: 'dist',
  format: 'esm',
  platform: 'node',
  target: 'node20',
  external: [
    ...productionDeps,
    ...devDependencies
  ],
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  // Tree shake unused development code
  treeShaking: true,
  // Don't bundle node_modules
  packages: 'external',
  // Enable code splitting for dynamic imports
  splitting: false,
  // Minify for production
  minify: false, // Keep readable for debugging
  // Source maps for debugging
  sourcemap: false
};

// Run build if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await build(buildConfig);
  console.log('✅ Production server build completed');
}