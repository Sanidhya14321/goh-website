import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { engineFromLatest, engineRepository } from '../src/lib/engine.ts';
import { latestRelease, writeCatalog } from './github-release.ts';

const { values } = parseArgs({ options: { fixture: { type: 'string' }, out: { type: 'string' } } });
const catalog = engineFromLatest(await latestRelease(engineRepository, values.fixture));
await writeCatalog(values.out || fileURLToPath(new URL('../data/engine.json', import.meta.url)), catalog);
console.log(`${engineRepository}: ${catalog.release?.tag ?? 'no public stable release'}`);
