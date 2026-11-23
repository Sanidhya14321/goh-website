import { parseArgs } from 'node:util';
import { readFile, rename, writeFile } from 'node:fs/promises';
import { catalogFromLatest, configSchema } from '../src/lib/downloads.ts';

const { values } = parseArgs({ options: { fixture: { type: 'string' }, out: { type: 'string' } } });
const configFile = JSON.parse(await readFile(new URL('../data/desktop-config.json', import.meta.url), 'utf8'));
const config = configSchema.parse({ ...configFile, repository: process.env.DESKTOP_RELEASE_REPO || configFile.repository });

async function getPublicRelease() {
  const response = await fetch(`https://api.github.com/repos/${config.repository}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
    signal: AbortSignal.timeout(15_000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub release lookup failed (HTTP ${response.status})`);
  return response.json();
}

const input: unknown = values.fixture
  ? JSON.parse(await readFile(values.fixture, 'utf8'))
  : await getPublicRelease();
const catalog = catalogFromLatest(config, input);
const output = values.out || new URL('../data/downloads.json', import.meta.url);
const temporary = typeof output === 'string' ? `${output}.${process.pid}.tmp` : new URL(`downloads.json.${process.pid}.tmp`, output);
await writeFile(temporary, JSON.stringify(catalog, null, 2) + '\n');
await rename(temporary, output);
console.log(`${config.repository}: ${catalog.status}${catalog.status === 'complete' ? ` (${catalog.tag}, ${catalog.assets.length} packages)` : ''}`);
