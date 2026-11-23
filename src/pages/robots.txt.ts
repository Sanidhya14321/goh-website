import type { APIRoute } from 'astro';
import { path } from '../lib/site';

export const GET: APIRoute = ({ site }) => new Response(
  site ? `User-agent: *\nAllow: /\nSitemap: ${new URL(path('sitemap.xml'), site).href}\n` : 'User-agent: *\nDisallow: /\n',
  { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
);
