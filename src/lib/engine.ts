import { z } from 'zod';
import { bytesSchema, stableRelease, tagSchema, uploadedAssets } from './releases.ts';

export const engineRepository = 'Sanidhya14321/goh';
export const engineGitHub = `https://github.com/${engineRepository}`;

export const enginePlatforms = [
  { name: 'macOS', icon: 'macos', assets: [
    { file: 'goh-darwin-arm64', arch: 'Apple silicon' },
    { file: 'goh-darwin-amd64', arch: 'Intel' },
  ] },
  { name: 'Linux', icon: 'linux', assets: [
    { file: 'goh-linux-amd64', arch: 'x86-64' },
    { file: 'goh-linux-arm64', arch: 'ARM64' },
  ] },
  { name: 'Windows', icon: 'windows', assets: [
    { file: 'goh-windows-amd64.exe', arch: 'x86-64' },
    { file: 'goh-windows-arm64.exe', arch: 'ARM64' },
  ] },
] as const;

const recognizedFiles = z.enum([...enginePlatforms.flatMap(({ assets }) => assets.map(({ file }) => file)), 'SHA256SUMS']);
const release = z.object({
  tag: tagSchema,
  assets: z.partialRecord(recognizedFiles, bytesSchema),
}).strict();

const engineCatalogSchema = z.object({
  schemaVersion: z.literal(1),
  release: release.nullable(),
}).strict();

export const readEngineCatalog = (input: unknown) => engineCatalogSchema.parse(input);

export function engineFromLatest(input: unknown) {
  const latest = stableRelease(input);
  return readEngineCatalog({
    schemaVersion: 1,
    release: latest ? {
      tag: latest.tag_name,
      assets: Object.fromEntries(uploadedAssets(latest)
        .filter(({ name }) => recognizedFiles.safeParse(name).success)
        .map(({ name, size }) => [name, size])),
    } : null,
  });
}
