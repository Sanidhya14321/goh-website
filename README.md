# GoHarness website

This Astro site publishes reviewed engine benchmarks and a build-time GoHarness Desktop download catalog. A production build produces HTML and CSS in `dist/`. Node runs on the build machine only.

## Local preview and checks

Use Node 22.23.4 or newer. The checked-in catalog reflects the absence of a public stable desktop release.

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

Add a reviewed JSON file to `data/benchmarks/` using the existing report as an example. Match the filename to its unique report ID, set `schemaVersion` to `1`, and use the evidence publication date. Point citations to a release tag or a full source commit with the supporting section or file. Include the measured build, model and run definition when the source supplies them. Chart entries point to values in their own tables. Solve percentages are calculated from attempts.

The homepage shows the newest reviewed report in its overview and retains all reports in publication order. Engine and desktop releases never change their labels. The initial set comes from the [v1.1.0 benchmark report](https://github.com/Sanidhya14321/goh/blob/v1.1.0/docs/BENCHMARKS.md) and [verification log](https://github.com/Sanidhya14321/goh/blob/v1.1.0/docs/development/VERIFICATION.md#110). The report is the published source for the loopback numbers. Its capture script is present in the engine workspace outside the tagged public tree. The engine [release workflow](https://github.com/Sanidhya14321/goh/blob/v1.1.0/.github/workflows/release.yml) publishes the separate [CLI release](https://github.com/Sanidhya14321/goh/releases/tag/v1.1.0) linked from the site.

## Refresh the desktop catalog

`data/desktop-config.json` sets the default repository and the packages required for a complete release. The initial required matrix covers universal macOS, Ubuntu amd64, and Windows amd64. Ubuntu arm64 and Windows arm64 are enabled only when their uploaded assets are present in a complete release. Update the required matrix once the desktop release owner confirms the promised variants. Set `DESKTOP_RELEASE_REPO` to override the default `owner/repo`.

```sh
npm run refresh:downloads
npm run build
```

The refresh checks GitHub’s public latest-release endpoint and writes `data/downloads.json`. An absent release or a partial required matrix produces an unavailable page. A network failure, rate limit, or invalid response fails the refresh and prevents deployment. A complete release supplies exact-name, nonempty uploaded assets. The primary buttons use GitHub’s latest-download URL. Version, size, and an available GitHub SHA-256 digest appear together with the pinned asset URL.

Use the same repository override for refresh and build. To try fixture data locally, run `npm run refresh:downloads -- --fixture scripts/fixtures/complete-release.json` and build. Run the ordinary refresh again to restore public metadata. Fixture downloads are for testing page states.

## Set up GitHub Pages once

1. Create the website repository on GitHub and push this repository as its default `main` branch.
2. In **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**. For a custom domain, configure it in Pages. The workflow reads the origin and base path from Pages.
3. If needed, set the repository Actions variable `DESKTOP_RELEASE_REPO` to the public desktop repository’s `owner/repo`.
4. Run **Refresh downloads and publish Pages** from the **Actions** tab. It fetches current metadata, rebuilds the whole site and deploys it. Subsequent pushes to `main` and manual runs use the same workflow. **Validate website** tests static builds against fixtures on pushes and pull requests.

When the desktop repository is ready, use a draft release, upload all required assets, then publish it as the latest stable release. After publication and whenever supported assets or displayed metadata change, dispatch the website workflow from the desktop pipeline. Use a GitHub App installation token or fine-grained token with **Actions: write** on the website repository, stored as a desktop repository secret. Pass it as `GH_TOKEN` to the dispatch step.

```sh
gh workflow run pages.yml --repo OWNER/goh-website --ref main
```

GitHub’s latest-download URLs follow the release GitHub marks latest immediately. Publish the complete matrix together and dispatch after uploads so new browser visits receive the current catalog as soon as Pages deploys it. The tag-specific metadata links continue to identify the exact assets recorded at build time.

[GitHub release links](https://docs.github.com/en/repositories/releasing-projects-on-github/linking-to-releases) · [GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
