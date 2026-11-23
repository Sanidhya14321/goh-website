import { z } from 'zod';

const text = z.string().trim().min(1);
const slug = z.string().regex(/^[a-z\d]+(?:-[a-z\d]+)*$/);
const positive = z.number().int().positive();
const number = z.number().nonnegative();
const decimals = z.number().int().min(0).max(2);
const cell = z.union([text, number]);
const source = z.object({
  label: text,
  url: z.url().refine((value) => /^https:\/\/github\.com\/Sanidhya14321\/goh\/(?:blob|tree)\/(?:v\d+\.\d+\.\d+[-\w.]*|[a-f0-9]{40})\//.test(value)),
}).strict();

const runs = z.object({
  kind: z.literal('live-solves'),
  grading: text,
  rows: z.array(z.object({
    name: text, harness: text, model: text, taskCount: positive, taskNotes: text,
    attempts: positive, solved: z.number().int().nonnegative(),
    falseCompletions: z.number().int().nonnegative(), toolCalls: number, seconds: number,
  }).strict()).min(1),
}).superRefine(({ rows }, ctx) => {
  rows.forEach((row, index) => {
    if (row.attempts < row.taskCount || row.solved + row.falseCompletions > row.attempts) {
      ctx.addIssue({ code: 'custom', path: ['rows', index], message: 'Inconsistent task or attempt totals' });
    }
  });
});

const measurements = z.object({
  kind: z.enum(['live-efficiency', 'loopback', 'machine']),
  columnLabels: z.array(text).min(2),
  rows: z.array(z.array(cell)).min(1),
  charts: z.array(z.object({
    title: text, unit: text, row: z.number().int().nonnegative(),
    columns: z.array(positive).min(2), decimals,
  }).strict()).optional(),
}).superRefine(({ columnLabels, rows, charts }, ctx) => {
  rows.forEach((row, index) => {
    if (row.length !== columnLabels.length || typeof row[0] !== 'string') {
      ctx.addIssue({ code: 'custom', path: ['rows', index], message: 'Expected a row label and one cell per column' });
    }
  });
  charts?.forEach((chart, index) => {
    if (new Set(chart.columns).size !== chart.columns.length || chart.columns.some((column) => typeof rows[chart.row]?.[column] !== 'number')) {
      ctx.addIssue({ code: 'custom', path: ['charts', index], message: 'Each chart requires distinct numeric cells from the same table row' });
    }
  });
});

const sectionSchema = z.object({
  id: slug,
  title: text,
  description: text,
  methodology: text,
  note: text.optional(),
  sources: z.array(source).min(1),
  result: z.union([runs, measurements]),
}).strict();

const benchmarkSchema = z.object({
  schemaVersion: z.literal(1),
  id: slug,
  title: text,
  published: z.iso.date(),
  sections: z.array(sectionSchema).min(1),
  spotlight: z.object({
    title: text,
    section: slug,
    rows: z.array(z.number().int().nonnegative()).min(2),
    description: text,
  }).strict().optional(),
}).strict()
  .refine(({ sections }) => new Set(sections.map(({ id }) => id)).size === sections.length, 'Section IDs must be unique')
  .refine(({ sections, spotlight }) => {
    if (!spotlight) return true;
    const result = sections.find(({ id }) => id === spotlight.section)?.result;
    return result?.kind === 'live-solves' &&
      new Set(spotlight.rows).size === spotlight.rows.length &&
      spotlight.rows.every((index) => index < result.rows.length);
  }, { path: ['spotlight'], message: 'Spotlight must reference distinct rows from a solve-rate section' });

export type BenchmarkSet = z.infer<typeof benchmarkSchema>;
export type BenchmarkSection = z.infer<typeof sectionSchema>;

export function readBenchmarkSets(files: Record<string, unknown>): BenchmarkSet[] {
  const sets = Object.entries(files).map(([file, data]) => {
    const result = benchmarkSchema.safeParse(data);
    if (!result.success) throw new Error(`Invalid benchmark set ${file}: ${result.error.message}`);
    if (!file.endsWith(`/${result.data.id}.json`)) throw new Error(`Benchmark ID must match its filename: ${file}`);
    return result.data;
  });
  if (!sets.length || sets.length !== new Set(sets.map(({ id }) => id)).size) {
    throw new Error('Expected at least one benchmark set and unique set IDs');
  }
  return sets.sort((a, b) => b.published.localeCompare(a.published) || a.id.localeCompare(b.id));
}

export function solveRate(solved: number, attempts: number): number {
  return Math.round(solved / attempts * 100);
}

export const categoryLabels = {
  'live-solves': 'Live model · Solve rates',
  'live-efficiency': 'Live model · Efficiency',
  loopback: 'Loopback · Request size',
  machine: 'Single machine · Harness speed',
};
