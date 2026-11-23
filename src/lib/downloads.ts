import { z } from 'zod';
import { bytesSchema, digestSchema, repositorySchema, stableRelease, tagSchema, uploadedAssets } from './releases.ts';

export const packages = [
  { id: 'macos-universal', name: 'goh-desktop-macos-universal.dmg', platform: 'macos', arch: 'Universal · Apple silicon and Intel', format: 'DMG' },
  { id: 'ubuntu-amd64', name: 'goh-desktop-ubuntu-amd64.deb', platform: 'ubuntu', arch: 'x86-64 · amd64', format: 'DEB' },
  { id: 'ubuntu-arm64', name: 'goh-desktop-ubuntu-arm64.deb', platform: 'ubuntu', arch: 'ARM64 · arm64', format: 'DEB' },
  { id: 'windows-amd64', name: 'goh-desktop-windows-amd64-installer.exe', platform: 'windows', arch: 'x86-64 · amd64', format: 'EXE' },
  { id: 'windows-arm64', name: 'goh-desktop-windows-arm64-installer.exe', platform: 'windows', arch: 'ARM64 · arm64', format: 'EXE' },
] as const;

const variants = z.enum(packages.map(({ id }) => id));
export const configSchema = z.object({
  repository: repositorySchema,
  requiredVariants: z.array(variants).min(1).refine((ids) => new Set(ids).size === ids.length, 'Duplicate required variant'),
}).strict();

const catalogBase = { schemaVersion: z.literal(1), repository: repositorySchema };
const assetSchema = z.object({ variant: variants, bytes: bytesSchema, digest: digestSchema.optional() }).strict();

const catalogSchema = z.discriminatedUnion('status', [
  z.object({ ...catalogBase, status: z.literal('absent') }).strict(),
  z.object({ ...catalogBase, status: z.literal('partial'), missing: z.array(variants).min(1) }).strict(),
  z.object({ ...catalogBase, status: z.literal('complete'), tag: tagSchema, assets: z.array(assetSchema).min(1) }).strict(),
]);

export type Catalog = z.infer<typeof catalogSchema>;
type Config = z.infer<typeof configSchema>;

export function catalogFromLatest(config: Config, input: unknown): Catalog {
  const base = { schemaVersion: 1, repository: config.repository } as const;
  const release = stableRelease(input);
  if (!release) return { ...base, status: 'absent' };

  const available = new Map(uploadedAssets(release).map((asset) => [asset.name, asset]));
  const assets = packages.flatMap(({ id, name }) => {
    const asset = available.get(name);
    if (!asset) return [];
    const digest = digestSchema.safeParse(asset.digest);
    return [{ variant: id, bytes: asset.size, ...(digest.success ? { digest: digest.data } : {}) }];
  });

  const missing = config.requiredVariants.filter((id) => !assets.some((asset) => asset.variant === id));
  if (missing.length) return { ...base, status: 'partial', missing };
  return { ...base, status: 'complete', tag: release.tag_name, assets };
}

export function readCatalog(input: unknown, config: Config): Catalog {
  const catalog = catalogSchema.parse(input);
  if (catalog.repository.toLowerCase() !== config.repository.toLowerCase()) {
    throw new Error('The download catalog repository differs from configuration. Refresh the catalog.');
  }
  if (catalog.status === 'complete') {
    const ids = new Set(catalog.assets.map(({ variant }) => variant));
    if (ids.size !== catalog.assets.length || config.requiredVariants.some((variant) => !ids.has(variant))) {
      throw new Error('The complete download catalog contains duplicate assets or lacks required variants. Refresh the catalog.');
    }
  }
  if (catalog.status === 'partial' && (new Set(catalog.missing).size !== catalog.missing.length ||
    catalog.missing.some((variant) => !config.requiredVariants.includes(variant)))) {
    throw new Error('The partial download catalog is inconsistent with the required variants. Refresh the catalog.');
  }
  return catalog;
}
