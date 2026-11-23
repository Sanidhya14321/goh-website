import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { packages } from '../src/lib/downloads.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const work = mkdtempSync(join(tmpdir(), 'goh-site-build-'));
const repo = 'fixture-owner/fixture-desktop';
const catalog = join(work, 'catalog.json');
const env = { ...process.env, SITE_BASE: '/goh-website', SITE_URL: 'https://fixture-owner.github.io', ASTRO_TELEMETRY_DISABLED: '1', DESKTOP_RELEASE_REPO: repo, GOH_DOWNLOAD_CATALOG: catalog };

try {
  for (const state of ['complete', 'partial', 'absent'] as const) {
    execFileSync(process.execPath, ['scripts/refresh-downloads.ts', '--fixture', `scripts/fixtures/${state}-release.json`, '--out', catalog], { cwd: root, env, stdio: 'inherit' });
    const out = join(work, state);
    execFileSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build', '--outDir', out], { cwd: root, env, stdio: 'inherit' });
    const home = readFileSync(join(out, 'index.html'), 'utf8');
    const downloads = readFileSync(join(out, 'downloads/index.html'), 'utf8');

    assert.ok(home.includes('href="/goh-website/downloads/"'));
    assert.ok(home.includes('href="/goh-website/icon.svg"'));
    assert.ok(home.includes('/goh-website/_astro/'));
    assert.ok(home.includes('14 (74%)') && home.includes('20 (77%)') && home.includes('56 (100%)'));
    assert.ok(home.includes('/blob/v1.1.0/docs/BENCHMARKS.md#results'));
    assert.ok(downloads.includes('/goh/releases/tag/v1.1.0'));
    assert.doesNotMatch(home + downloads, /<script\b|api\.github\.com/);

    const stableBase = `https://github.com/${repo}/releases/`;
    if (state === 'complete') {
      assert.ok(downloads.includes('Stable desktop packages available'));
      for (const { name } of packages) {
        assert.ok(downloads.includes(`${stableBase}latest/download/${name}`));
        assert.ok(downloads.includes(`${stableBase}download/v2.3.4/${name}`));
      }
      assert.ok(downloads.includes('v2.3.4 · 11.4 MiB'));
      assert.ok(downloads.includes('ab'.repeat(32)));
    } else {
      assert.ok(downloads.includes('Desktop downloads unavailable'));
      assert.ok(downloads.includes(state === 'partial' ? 'missing required packages' : 'no public stable desktop release'));
      assert.ok(!downloads.includes(stableBase));
      assert.ok(!downloads.includes('v2.3.4'));
    }
    console.log(`Verified static HTML with ${state} desktop release metadata`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
