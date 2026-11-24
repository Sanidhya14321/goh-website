# GoHarness website

This Astro site publishes reviewed engine benchmarks and a build-time GoHarness Desktop download catalog. A production build produces HTML and CSS in `dist/`. Node runs on the build machine only.

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

`data/engine.json` tracks public stable CLI releases from [Sanidhya14321/goh](https://github.com/Sanidhya14321/goh/releases/latest). The site shows uploaded CLI assets for macOS, Linux, and Windows. Primary links follow GitHub’s latest stable release immediately. The release tag, size, and SHA-256 checksums link to the exact version they describe.

`data/desktop-config.json` sets the Desktop repository and the matrix required for a complete release. The default requires macOS Universal, Ubuntu amd64, and Windows amd64. Ubuntu and Windows arm64 links appear when their uploaded assets are present in a complete stable release. Set `DESKTOP_RELEASE_REPO` to override the default `owner/repo` and use the same value for refresh and build.

```sh
npm run refresh:engine
npm run refresh:downloads
npm run build
```

Both scripts resolve GitHub’s public latest-release endpoint at build time. Absent or incomplete Desktop releases remain unavailable. CLI availability is evaluated per binary. HTTP errors other than 404, including rate limits, fail the refresh and prevent deployment. `npm run test:build` uses fixtures and checks release links, benchmark independence, canonical URLs, social metadata, the sitemap, and the 404 page.

## Production on Vercel

The Vercel project builds the `main` branch from this repository. Its build command refreshes the public CLI and Desktop catalogs before Astro generates the static files. The production hostname comes from Vercel, and preview builds use `noindex`. The headers in `vercel.json` enforce HTTPS, disable scripts and framing, and restrict image and font loads to this origin. Inline styles are permitted for the static chart geometry.

A Vercel Deploy Hook on `main` can refresh package metadata immediately after a release. Keep its URL in the publisher’s `GOH_WEBSITE_VERCEL_HOOK` Actions secret. Treat the hook URL as a credential. Once configured, release workflows can send a POST without a broad Vercel API token.

## Optional GitHub Pages setup

1. Push this website repository to GitHub with `main` as its default branch.
2. In **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**. For a custom domain, configure it in Pages. The deployment workflow reads the public origin and base path from Pages.
3. Set the website repository Actions variable `PUBLISH_GITHUB_PAGES=true`. If needed, set `DESKTOP_RELEASE_REPO` to the public Desktop release repository’s `owner/repo`.
4. Run **Refresh downloads and publish Pages** from the **Actions** tab for the first deployment. Pushes to `main` and the hourly fallback also refresh both catalogs. **Validate website** runs build checks on pushes and pull requests.

The engine repository has a separate **Refresh GoHarness website** workflow. It runs after the stable engine publication and package-manager steps, and responds to stable release events initiated by maintainers. In the engine repo, set `GOH_WEBSITE_REPO` to the website repository’s `owner/repo` and store a fine-grained token with **Actions: write** on that website repository as the `GOH_WEBSITE_REFRESH_TOKEN` Actions secret. The release pipeline dispatches the website’s `pages.yml`; the site always fetches current metadata. GitHub queues and runs the rebuild after dispatch. The fallback covers asset changes that do not emit a release event.

The Desktop publisher can trigger the same workflow after uploading and promoting a complete stable release. Use a token scoped to **Actions: write** on the website repo in its `GH_TOKEN` environment variable.

```sh
gh workflow run pages.yml --repo OWNER/goh-website
```

For other static hosts, set `SITE_URL` to the production origin, set `SITE_BASE` if the website is served below the domain root, and publish `dist/`. Builds without a production URL use `noindex`. The sitemap lists both public pages. If Pages serves the site below a path prefix, submit the sitemap URL directly in search engine webmaster tools, since crawlers look for robots.txt at the domain root.

The homepage terminal image comes from the [engine’s v1.1.0 documentation](https://github.com/Sanidhya14321/goh/blob/v1.1.0/docs/images/tui-session.png). The website crops the footer of the original screenshot and serves responsive WebP renditions.

[GitHub release links](https://docs.github.com/en/repositories/releasing-projects-on-github/linking-to-releases) · [GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
