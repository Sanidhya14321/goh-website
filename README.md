# GoHarness website beta

This Astro site publishes reviewed engine benchmarks and a build-time GoHarness Desktop Beta download catalog. Update the beta site content when harness development is complete. A production build produces HTML and CSS in `dist/`. Node runs on the build machine only.

- [Live GoHarness website](https://goh-website-three.vercel.app)
- [GoHarness engine and CLI releases](https://github.com/Sanidhya14321/goh)
- [GoHarness Desktop source](https://github.com/Sanidhya14321/goh-desktop) and [package availability](https://goh-website-three.vercel.app/downloads/#desktop)

## Local preview and checks

Use Node 22.23.4 or newer. The checked-in catalogs include the published GoHarness CLI release and the current Desktop availability.

```sh
npm ci
npm run check
npm test
npm run test:build
npm run build
npm run preview -- --host 127.0.0.1
```

Open the URL printed by Astro. For live reload while editing, use `npm run dev`. To try the site under a path prefix, set `SITE_BASE=/goh-website` for both build and preview. `npm run test:build` builds with complete, partial, and absent GitHub metadata fixtures, in a temporary directory. It requires no GitHub API access.

## Publish a benchmark report

Add a reviewed JSON file to `data/benchmarks/` using the existing report as an example. Match the filename to its unique report ID, set `schemaVersion` to `1`, and use the evidence publication date. Point citations to a release tag or a full source commit with the supporting section or file. Include the measured build, model and run definition when the source supplies them. Chart entries point to values in their own tables. An optional spotlight selects rows from a solve-rate section for the homepage. Solve percentages are calculated from attempts.

The homepage shows the newest reviewed report in its overview and retains all reports in publication order. Engine and desktop releases never change their labels. The initial set comes from the [v1.1.0 benchmark report](https://github.com/Sanidhya14321/goh/blob/v1.1.0/docs/BENCHMARKS.md) and [verification log](https://github.com/Sanidhya14321/goh/blob/v1.1.0/docs/development/VERIFICATION.md#110). The report is the published source for the loopback numbers. Its capture script is present in the engine workspace outside the tagged public tree. The engine [release workflow](https://github.com/Sanidhya14321/goh/blob/v1.1.0/.github/workflows/release.yml) produced the [v1.1.0 CLI release](https://github.com/Sanidhya14321/goh/releases/tag/v1.1.0).

## Refresh the release catalogs

`data/engine.json` tracks public stable CLI releases from [Sanidhya14321/goh](https://github.com/Sanidhya14321/goh/releases/latest). The site shows uploaded CLI assets for macOS, Linux, and Windows. Binary links, sizes, and SHA-256 checksums refer to the same published version.

`data/desktop-config.json` sets the Desktop repository and the matrix required for a complete release. The default requires the five installers produced by the desktop release workflow for macOS Universal, Ubuntu amd64 and arm64, and Windows amd64 and arm64. The website links to the bundled GoHarness engine version when the Desktop release notes record it. To change the production Desktop release repository, update `data/desktop-config.json` and refresh the catalog in the same commit. Local and Pages builds can use `DESKTOP_RELEASE_REPO` for a matching refresh and build.

```sh
npm run refresh:engine
npm run refresh:downloads
npm run build
```

Both scripts resolve GitHub’s public latest-release endpoint at build time. Absent or incomplete Desktop releases remain unavailable. CLI availability is evaluated per binary. HTTP errors other than 404, including rate limits, fail the refresh and prevent deployment. `npm run test:build` uses fixtures and checks release links, benchmark independence, canonical URLs, social metadata, the sitemap, and the 404 page.

## Production on Vercel

The Vercel project builds the `main` branch. [Sync GoHarness releases](.github/workflows/sync-releases.yml) checks the public CLI and Desktop releases on GitHub hourly and on manual dispatch. It commits the catalogs to the default branch only when the release data changes. Vercel deploys the updated catalogs through its GitHub integration. GitHub may delay scheduled runs. The download links remain pinned to the catalog’s exact version between builds.

The production hostname comes from Vercel, and preview builds use `noindex`. The headers in `vercel.json` enforce HTTPS, block framing and outbound browser requests made by page scripts, and restrict image, stylesheet, and font loads to this origin. The two interactive pages load a single script pinned by both CSP and Subresource Integrity. Inline scripts and styles are blocked. When editing `public/interactions.js`, regenerate its CSP hash with `openssl dgst -sha384 -binary public/interactions.js | openssl base64 -A` and replace the existing value after `sha384-` in `vercel.json`. The static build test checks that the file, CSP, and rendered script integrity agree.

## Optional GitHub Pages setup

1. In **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**. The deployment workflow reads the public origin and base path from Pages.
2. Set the Actions variable `PUBLISH_GITHUB_PAGES=true`. Set `DESKTOP_RELEASE_REPO` if the public Desktop releases are hosted in a different repository.
3. Run **Refresh downloads and publish Pages** for the first deployment. Pushes to `main` and a scheduled check refresh both catalogs. **Validate website** runs build checks on pushes and pull requests.

For other static hosts, set `SITE_URL` to the production origin, set `SITE_BASE` if the website is served below the domain root, and publish `dist/`. Builds without a production URL use `noindex`. The sitemap lists both public pages. If Pages serves the site below a path prefix, submit the sitemap URL directly in search engine webmaster tools, since crawlers look for robots.txt at the domain root.

The homepage terminal image comes from the [engine’s v1.1.0 documentation](https://github.com/Sanidhya14321/goh/blob/v1.1.0/docs/images/tui-session.png). The website crops the footer of the original screenshot and serves responsive WebP renditions.

[GitHub release links](https://docs.github.com/en/repositories/releasing-projects-on-github/linking-to-releases) · [GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
