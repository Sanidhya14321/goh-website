export const upstream = 'https://github.com/Sanidhya14321/goh';
export const cliRelease = `${upstream}/releases/tag/v1.1.0`;
export const cliInstall = `${upstream}/blob/v1.1.0/README.md#install`;

export function path(route = ''): string {
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${route}`;
}
