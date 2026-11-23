import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { readBenchmarkSets, solveRate } from '../src/lib/benchmarks.ts';
import { engineFromLatest } from '../src/lib/engine.ts';
import { catalogFromLatest, configSchema, packages, readCatalog } from '../src/lib/downloads.ts';

function json(path: string) {
  return JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
}

const complete = json('./fixtures/complete-release.json');
const partial = json('./fixtures/partial-release.json');
const config = configSchema.parse({
  repository: 'fixture-owner/fixture-desktop',
  requiredVariants: ['macos-universal', 'ubuntu-amd64', 'windows-amd64'],
});

test('latest complete release exposes uploaded, nonempty, recognized assets only', () => {
  const catalog = catalogFromLatest(config, complete);
  assert.equal(catalog.status, 'complete');
  assert.deepEqual(readCatalog(catalog, config), catalog);
  if (catalog.status !== 'complete') return;
  assert.deepEqual(catalog.assets.map(({ variant }) => variant), packages.map(({ id }) => id));
  assert.equal(catalog.assets[0].digest, `sha256:${'ab'.repeat(32)}`);
  const unconfirmed = {
    ...complete,
    assets: complete.assets.map((asset: { name: string }) => asset.name === packages[4].name
      ? { ...asset, size: 0, state: 'open' }
      : asset),
  };
  const verifiedAssetsOnly = catalogFromLatest(config, unconfirmed);
  assert.ok(verifiedAssetsOnly.status === 'complete' && !verifiedAssetsOnly.assets.some(({ variant }) => variant === 'windows-arm64'));
  const allRequired = configSchema.parse({ ...config, requiredVariants: packages.map(({ id }) => id) });
  assert.equal(catalogFromLatest(allRequired, unconfirmed).status, 'partial');
});

test('latest partial release exposes no downloadable assets', () => {
  const catalog = catalogFromLatest(config, partial);
  assert.deepEqual(catalog, { schemaVersion: 1, repository: config.repository, status: 'partial', missing: config.requiredVariants });
});

test('absence, draft and prerelease metadata expose no downloadable assets', () => {
  for (const release of [null, { ...complete, draft: true }, { ...complete, prerelease: true }, { ...complete, published_at: null }]) {
    assert.deepEqual(catalogFromLatest(config, release), { schemaVersion: 1, repository: config.repository, status: 'absent' });
  }
  assert.equal(catalogFromLatest(config, { ...complete, tag_name: 'stable-2026-11' }).status, 'complete');
  assert.throws(() => catalogFromLatest(config, {}));
});

test('catalog validation rejects a wrong repository and an incomplete complete catalog', () => {
  const catalog = catalogFromLatest(config, complete);
  assert.throws(() => readCatalog({ ...catalog, repository: 'example/wrong' }, config));
  assert.throws(() => readCatalog({ ...catalog, assets: [] }, config));
});

test('reviewed benchmark files retain their own version and use coherent cohorts', () => {
  const name = 'engine-1-1-0';
  const file = `../data/benchmarks/${name}.json`;
  const seed = json(file);
  const newFile = '../data/benchmarks/next-report.json';
  const next = { ...seed, id: 'next-report', published: '2026-11-24' };
  const [newest, oldest] = readBenchmarkSets({ [file]: seed, [newFile]: next });
  assert.equal(newest.id, 'next-report');
  assert.equal(oldest.id, name);
  assert.ok(oldest.sections.every(({ sources }) => sources.some(({ url }) => url.includes('/blob/v1.1.0/'))));
  assert.equal(solveRate(14, 19), 74);
  assert.equal(solveRate(20, 26), 77);
  seed.sections[0].result.rows[0].solved = 23;
  assert.throws(() => readBenchmarkSets({ [file]: seed }));
  const wrongSpotlight = { ...next, spotlight: { ...next.spotlight, rows: [3, 99] } };
  assert.throws(() => readBenchmarkSets({ [newFile]: wrongSpotlight }));
  next.sections = json(file).sections;
  next.sections[1].result.charts[0].columns = [1, 9];
  assert.throws(() => readBenchmarkSets({ [newFile]: next }));
});

test('engine catalog follows the stable tag and only exposes recognized uploaded assets', () => {
  const source = json('./fixtures/engine-release.json');
  const { release } = engineFromLatest(source);
  assert.equal(release?.tag, 'v9.2.3');
  assert.equal(Object.keys(release?.assets ?? {}).length, 7);
  assert.equal(release?.assets['goh-linux-amd64'], 15339680);
  assert.equal(engineFromLatest({ ...source, prerelease: true }).release, null);
  const partial = engineFromLatest({ ...source, assets: [
    { name: 'goh-linux-amd64', state: 'open', size: 600 },
    { name: 'goh-darwin-amd64', state: 'uploaded', size: 500 },
    { name: 'goh-windows-amd64.exe', state: 'uploaded', size: 250 },
    { name: 'goh-windows-amd64.exe', state: 'uploaded', size: 300 },
  ] });
  assert.deepEqual(partial.release?.assets, { 'goh-darwin-amd64': 500 });
});
