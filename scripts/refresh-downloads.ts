import { parseArgs } from 'node:util';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { catalogFromLatest, configSchema } from '../src/lib/downloads.ts';
import { latestRelease, writeCatalog } from './github-release.ts';

const { values } = parseArgs({ options: { fixture: { type: 'string' }, out: { type: 'string' } } });
const configFile = JSON.parse(await readFile(new URL('../data/desktop-config.json', import.meta.url), 'utf8'));
const config = configSchema.parse({ ...configFile, repository: process.env.DESKTOP_RELEASE_REPO || configFile.repository });
const catalog = catalogFromLatest(config, await latestRelease(config.repository, values.fixture));
await writeCatalog(values.out || fileURLToPath(new URL('../data/downloads.json', import.meta.url)), catalog);
console.log(`${config.repository}: ${catalog.status}${catalog.status === 'complete' ? ` (${catalog.tag}, ${catalog.assets.length} packages)` : ''}`);
