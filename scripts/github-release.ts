import { readFile, rename, writeFile } from 'node:fs/promises';

export async function latestRelease(repository: string, fixture?: string): Promise<unknown> {
  if (fixture) return JSON.parse(await readFile(fixture, 'utf8'));

  const response = await fetch(`https://api.github.com/repos/${repository}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
    signal: AbortSignal.timeout(15_000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub release lookup for ${repository} failed (HTTP ${response.status})`);
  return response.json();
}

export async function writeCatalog(file: string, catalog: unknown) {
  const temporary = `${file}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(catalog, null, 2) + '\n');
  await rename(temporary, file);
}
