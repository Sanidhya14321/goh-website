import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { enginePlatforms, engineGitHub } from '../src/lib/engine.ts';
import { packages } from '../src/lib/downloads.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const work = mkdtempSync(join(tmpdir(), 'goh-site-build-'));
const repo = 'fixture-owner/fixture-desktop';
const catalog = join(work, 'desktop.json');
const engine = join(work, 'engine.json');
const env = { ...process.env, SITE_BASE: '/goh-website', SITE_URL: 'https://fixture-owner.github.io', ASTRO_TELEMETRY_DISABLED: '1', DESKTOP_RELEASE_REPO: repo, GOH_DOWNLOAD_CATALOG: catalog, GOH_ENGINE_CATALOG: engine };

try {
  for (const state of ['complete', 'partial', 'absent'] as const) {
    execFileSync(process.execPath, ['scripts/refresh-downloads.ts', '--fixture', `scripts/fixtures/${state}-release.json`, '--out', catalog], { cwd: root, env, stdio: 'inherit' });
    const engineFixture = state === 'absent' ? 'absent-release' : 'engine-release';
    execFileSync(process.execPath, ['scripts/refresh-engine.ts', '--fixture', `scripts/fixtures/${engineFixture}.json`, '--out', engine], { cwd: root, env, stdio: 'inherit' });
    const out = join(work, state);
    execFileSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build', '--outDir', out], { cwd: root, env, stdio: 'inherit' });
    const home = readFileSync(join(out, 'index.html'), 'utf8');
    const downloads = readFileSync(join(out, 'downloads/index.html'), 'utf8');
    const start = readFileSync(join(out, 'get-started/index.html'), 'utf8');
    const verification = readFileSync(join(out, 'verification/index.html'), 'utf8');
    const benchmarks = readFileSync(join(out, 'benchmarks/index.html'), 'utf8');
    assert.ok(home.includes('Resolve coding tasks with checks you can inspect.'));
    assert.ok(start.includes('GOH_INSTALL_DIR') && start.includes('/providers') && start.includes('/models'));
    assert.ok(verification.includes('id="access-settings"') && verification.includes('What stays on your machine'));
    assert.ok(home.includes('11.9k to 9.8k tokens per attempt'));
    assert.ok(home.includes('Website beta') && downloads.includes('Website beta'));
    assert.ok(downloads.includes('GoHarness Desktop Beta'));

    assert.ok(home.includes('href="/goh-website/downloads/"'));
    assert.ok(home.includes('href="/goh-website/icon.svg"'));
    assert.ok(home.includes('/goh-website/_astro/'));
    assert.ok(benchmarks.includes('14 (74%)') && benchmarks.includes('20 (77%)') && benchmarks.includes('56 (100%)'));
    assert.ok(benchmarks.includes('/blob/v1.1.0/docs/BENCHMARKS.md#results'));
    const site = 'https://fixture-owner.github.io/goh-website';
    const pages = [[home, '/'], [start, '/get-started/'], [verification, '/verification/'], [downloads, '/downloads/'], [benchmarks, '/benchmarks/']];
    for (const [html, route] of pages) {
      assert.ok(html.includes(`rel="canonical" href="${site}${route}"`));
      assert.ok(html.includes(`property="og:url" content="${site}${route}"`));
      assert.ok(html.includes(`property="og:image" content="${site}/social.png"`));
      assert.ok(html.includes('name="twitter:card" content="summary_large_image"'));
    }
    const sitemap = readFileSync(join(out, 'sitemap.xml'), 'utf8');
    for (const [, route] of pages) assert.ok(sitemap.includes(`<loc>${site}${route}</loc>`));
    assert.doesNotMatch(sitemap, /404/);
    assert.ok(readFileSync(join(out, 'robots.txt'), 'utf8').includes(`Sitemap: ${site}/sitemap.xml`));
    const notFound = readFileSync(join(out, '404.html'), 'utf8');
    assert.ok(notFound.includes('name="robots" content="noindex, follow"'));
    assert.ok(!notFound.includes('rel="canonical"'));
    assert.ok(readFileSync(join(out, 'social.png')).length > 0);
    const engineRelease = state !== 'absent';
    assert.ok(downloads.includes(`href="${engineGitHub}/releases${engineRelease ? '/latest' : ''}"`));
    for (const { file } of enginePlatforms.flatMap(({ assets }) => [...assets])) {
      assert.equal(downloads.includes(`${engineGitHub}/releases/download/v9.2.3/${file}`), engineRelease);
    }
    assert.equal(downloads.includes(`${engineGitHub}/releases/download/v9.2.3/SHA256SUMS`), engineRelease);
    assert.ok(!home.includes('v9.2.3'));
    const interaction = readFileSync(join(out, 'interactions.js'));
    const integrity = `sha384-${createHash('sha384').update(interaction).digest('base64')}`;
    const vercel = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
    const policy = vercel.headers[0].headers.find(({ key }: { key: string }) => key === 'Content-Security-Policy').value;
    assert.ok(policy.includes(`script-src '${integrity}'`));
    assert.ok(policy.includes("style-src 'self'; style-src-attr 'none'"));
    for (const [html, route] of pages) {
      assert.doesNotMatch(html, /api\.github\.com|\/Users\/|<style\b|\sstyle="/);
      const scripts = html.match(/<script\b[^>]*>[\s\S]*?<\/script>/g) ?? [];
      assert.equal(scripts.length, route === '/get-started/' || route === '/benchmarks/' ? 1 : 0);
      for (const script of scripts) {
        assert.ok(script.startsWith('<script src="/goh-website/interactions.js"'));
        assert.ok(script.includes(`integrity="${integrity}"`));
        assert.ok(script.endsWith('></script>'));
      }
    }

    const stableBase = `https://github.com/${repo}/releases/`;
    if (state === 'complete') {
      assert.ok(downloads.includes('Desktop Beta packages available'));
      for (const { name } of packages) {
        assert.ok(downloads.includes(`${stableBase}download/v2.3.4/${name}`));
      }
      assert.ok(downloads.includes('v2.3.4 · 11.4 MiB'));
      assert.ok(downloads.includes(`${stableBase}tag/v2.3.4`));
      assert.ok(downloads.includes(`${engineGitHub}/releases/tag/v1.1.0`));
      assert.ok(downloads.includes('bundles <a'));
      assert.ok(downloads.includes('ab'.repeat(32)));
    } else {
      assert.ok(downloads.includes('Desktop downloads unavailable'));
      assert.ok(downloads.includes(state === 'partial' ? 'missing required packages' : 'no public Desktop Beta packages'));
      assert.ok(!downloads.includes(stableBase));
      assert.ok(!downloads.includes('v2.3.4'));
    }
    console.log(`Verified static HTML with ${state} desktop release metadata`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
