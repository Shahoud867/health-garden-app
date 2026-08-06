/**
 * Runs exactly once, before any test file, in its own process (Vitest's
 * `globalSetup` contract) -- the one place that can reliably run before the
 * database suite becomes non-hermetic.
 *
 * Phase 6 registered real, live pg_cron jobs (migration 0011). Once they
 * exist, the suite is no longer hermetic on its own: a job firing mid-run
 * could touch rows an assertion is about to check. Unscheduling all jobs for
 * the duration of the run removes that non-determinism; `teardown` restores
 * them afterward from a snapshot taken before unscheduling, rather than
 * hardcoding the schedule strings a second time (which would drift from
 * migration 0011 silently).
 *
 * 'weekly-garden-archival' was the original motivating case (it called the
 * same function weekly-archive.test.ts exercised manually) but garden
 * mechanic v2 (docs/adr/0026) replaced it with event-driven planting inside
 * sync_garden_state, so that job no longer exists -- this mechanism is kept
 * because the remaining three jobs (engagement-nudge, gemini-quota-watchdog,
 * payment-reconciliation) still pose the identical hazard.
 */

import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';

const JOB_NAMES = ['engagement-nudge', 'gemini-quota-watchdog', 'payment-reconciliation'];

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
      // All three remaining jobs invoke an Edge Function; only the name
      // differs, and 'engagement-nudge' is the one whose job name doesn't
      // match its target function name (notify-inactive-users).
      const targetFunction =
        job.jobname === 'engagement-nudge' ? 'notify-inactive-users' : job.jobname;
      const command = `SELECT invoke_edge_function('${targetFunction}');`;
      await client.query('SELECT cron.schedule($1, $2, $3)', [job.jobname, job.schedule, command]);
    }
  } finally {
    await client.end();
    unlinkSync(SNAPSHOT_PATH);
  }
}
