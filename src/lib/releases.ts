import { z } from 'zod';

export const repositorySchema = z.string().regex(/^[a-z\d](?:[a-z\d-]*[a-z\d])?\/(?!\.{1,2}$)[a-z\d_.-]+$/i);
export const tagSchema = z.string().regex(/^(?!\.{1,2}$)\S+$/);
export const digestSchema = z.string().regex(/^sha256:[a-f\d]{64}$/i);
export const bytesSchema = z.number().int().positive();

const releaseSchema = z.object({
  tag_name: z.string(),
  draft: z.boolean(),
  prerelease: z.boolean(),
  published_at: z.iso.datetime().nullable(),
  body: z.string().nullish(),
  assets: z.array(z.object({
    name: z.string(),
    state: z.string(),
    size: z.number().int().nonnegative(),
    digest: z.string().nullish(),
  })),
});

export function stableRelease(input: unknown) {
  if (input === null) return null;

  const release = releaseSchema.parse(input);
  if (release.draft || release.prerelease || !release.published_at || !tagSchema.safeParse(release.tag_name).success) {
    return null;
  }
  return { ...release, published_at: release.published_at };
}

export function uploadedAssets(release: NonNullable<ReturnType<typeof stableRelease>>) {
  const counts = new Map<string, number>();
  for (const asset of release.assets) {
    counts.set(asset.name, (counts.get(asset.name) ?? 0) + 1);
  }
  return release.assets.filter(({ name, state, size }) => counts.get(name) === 1 && state === 'uploaded' && size > 0);
}

export function packageLink(repo: string, tag: string, name: string) {
  return `https://github.com/${repo}/releases/download/${encodeURIComponent(tag)}/${name}`;
}

const mib = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
export function formatBytes(bytes: number) {
  return bytes >= 1048576 ? `${mib.format(bytes / 1048576)} MiB` : `${bytes.toLocaleString('en-US')} bytes`;
}
