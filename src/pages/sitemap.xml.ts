import type { APIRoute } from 'astro';
import { path, siteRoutes } from '../lib/site';

export const GET: APIRoute = ({ site }) => {
  const urls = site ? Object.values(siteRoutes).map((route) => {
    const url = new URL(path(route), site).href.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
    return `  <url><loc>${url}</loc></url>`;
  }) : [];
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
