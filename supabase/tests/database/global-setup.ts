/**
 * Runs exactly once, before any test file, in its own process (Vitest's
 * `globalSetup` contract) -- the one place that can reliably run before the
 * database suite becomes non-hermetic.
 *
 * Phase 6 registered real, live pg_cron jobs (migration 0011). Once they
 * exist, the suite is no longer hermetic on its own: 'weekly-garden-archival'
 * calls the exact same archive_and_reset_stale_garden_rows() function
 * weekly-archive.test.ts calls manually, and if the cron schedule happens to
 * fire during a CI run, it can process the same stale row an assertion is
 * about to check, producing an extra permanent_garden row nothing in the
 * test itself caused. Unscheduling all four jobs for the duration of the
 * run removes that non-determinism; `teardown` restores them afterward from
 * a snapshot taken before unscheduling, rather than hardcoding the schedule
 * strings a second time (which would drift from migration 0011 silently).
 */

import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';

const JOB_NAMES = [
  'weekly-garden-archival',
  'engagement-nudge',
  'gemini-quota-watchdog',
  'payment-reconciliation',
];

const SNAPSHOT_PATH = join(tmpdir(), 'health-garden-cron-jobs-snapshot.json');

export function cronJobsSnapshotPath(): string {
  return SNAPSHOT_PATH;
}

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL ?? process.env.DB_URL;
  if (!url) {
    throw new Error('DATABASE_URL (or DB_URL) must be set before running the database test suite.');
  }
  return url;
}

export async function setup(): Promise<void> {
  const client = new pg.Client({ connectionString: requireDatabaseUrl() });
  await client.connect();
  try {
    const { rows } = await client.query<{ jobname: string; schedule: string }>(
      `SELECT jobname, schedule FROM cron.job WHERE jobname = ANY($1) ORDER BY jobname`,
      [JOB_NAMES],
    );
    writeFileSync(SNAPSHOT_PATH, JSON.stringify(rows), 'utf-8');

    for (const row of rows) {
      await client.query('SELECT cron.unschedule($1)', [row.jobname]);
    }
  } finally {
    await client.end();
  }
}

export async function teardown(): Promise<void> {
  if (!existsSync(SNAPSHOT_PATH)) return;

  const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf-8')) as {
    jobname: string;
    schedule: string;
  }[];

  const client = new pg.Client({ connectionString: requireDatabaseUrl() });
  await client.connect();
  try {
    for (const job of snapshot) {
      // The command each job runs is fixed and known (this is the same set
      // migration 0011 defines) -- re-registering by name/schedule/command
      // is restoring the migration's own state, not inventing new behavior.
      const command =
        job.jobname === 'weekly-garden-archival'
          ? 'SELECT archive_and_reset_stale_garden_rows();'
          : `SELECT invoke_edge_function('${job.jobname === 'engagement-nudge' ? 'notify-inactive-users' : job.jobname}');`;
      await client.query('SELECT cron.schedule($1, $2, $3)', [job.jobname, job.schedule, command]);
    }
  } finally {
    await client.end();
    unlinkSync(SNAPSHOT_PATH);
  }
}
