import { buildConfig } from './esbuild.config.js';
import { build } from 'esbuild';

await build(buildConfig);
console.log('✅ Server build completed');