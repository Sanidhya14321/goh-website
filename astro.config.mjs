import { defineConfig } from 'astro/config';

const vercelOrigin = process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined;

export default defineConfig({
  output: 'static',
  build: { inlineStylesheets: 'never' },
  markdown: { syntaxHighlight: false },
  site: process.env.SITE_URL || vercelOrigin,
  base: process.env.SITE_BASE || '/',
  trailingSlash: 'always',
});
