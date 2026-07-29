import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { newPgClient } from './helpers';

describe('database timezone (Blueprint §5.10, G-16)', () => {
  const client = newPgClient();

  beforeAll(async () => {
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  it('is pinned to Asia/Karachi, not the platform default UTC', async () => {
    const { rows } = await client.query<{ tz: string }>("SELECT current_setting('timezone') AS tz");
    expect(rows[0]!.tz).toBe('Asia/Karachi');
  });

  it('computes CURRENT_DATE as the real Asia/Karachi calendar day, not UTC', async () => {
    const { rows } = await client.query<{ today: Date }>('SELECT CURRENT_DATE AS today');
    const dbToday = rows[0]!.today.toISOString().slice(0, 10);

    // PKT is UTC+5 with no DST (§5.10) -- reproduce "today in Karachi" independently
    // of the DB, so this test actually exercises the timezone fix rather than
    // just comparing the DB to itself.
    const nowInKarachi = new Date(Date.now() + 5 * 60 * 60 * 1000);
    const expectedToday = nowInKarachi.toISOString().slice(0, 10);

    expect(dbToday).toBe(expectedToday);
  });
});
