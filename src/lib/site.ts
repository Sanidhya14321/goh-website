export { engineGitHub as upstream } from './engine.ts';

export const siteRoutes = { benchmarks: '', downloads: 'downloads/' } as const;

export function path(route = ''): string {
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${route}`;
}
