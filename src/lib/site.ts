import { engineGitHub } from './engine.ts';

export const upstream = engineGitHub;
export const taggedSource = `${upstream}/blob/v1.1.0`;
export const userGuide = `${taggedSource}/docs/USER_GUIDE.md`;

export const siteRoutes = {
  home: '',
  start: 'get-started/',
  downloads: 'downloads/',
  verification: 'verification/',
  benchmarks: 'benchmarks/',
} as const;
export type SitePage = keyof typeof siteRoutes | 'not-found';

export function path(route = ''): string {
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${route}`;
}
