import { assertEquals, assertRejects } from '@std/assert';
import { AppError } from '../_shared/http/errors.ts';
import { buildAccountExport, type QueryableClient } from './handler.ts';

function fakeClient(
  rowsByTable: Record<string, readonly Record<string, unknown>[]>,
  failingTable?: string,
): QueryableClient {
  return {
    from: (table: string) => ({
      select: (_columns: string) => {
        if (table === failingTable) {
          return Promise.resolve({ data: null, error: { code: '42501', message: 'boom' } });
        }
        return Promise.resolve({ data: rowsByTable[table] ?? [], error: null });
      },
    }),
  };
}

Deno.test('buildAccountExport', async (t) => {
  await t.step('includes every user-owned table in the export', async () => {
    const result = await buildAccountExport(fakeClient({}));

    const expectedTables = [
      'users',
      'food_logs',
      'workout_logs',
      'water_logs',
      'weight_logs',
      'garden_state',
      'permanent_garden',
      'subscriptions',
      'payment_intents',
      'daily_ai_usage',
      'ai_plans',
      'symptom_logs',
      'push_tokens',
      'audit_log',
      'organization_members',
    ];
    assertEquals(Object.keys(result.data).sort(), expectedTables.sort());
  });

  await t.step("carries each table's own rows through unchanged", async () => {
    const foodLogs = [{ id: 1, log_date: '2026-01-01' }];
    const result = await buildAccountExport(fakeClient({ food_logs: foodLogs }));
    assertEquals(result.data.food_logs, foodLogs);
    assertEquals(result.data.workout_logs, []);
  });

  await t.step('stamps an exportedAt timestamp', async () => {
    const before = Date.now();
    const result = await buildAccountExport(fakeClient({}));
    const stamped = new Date(result.exportedAt).getTime();
    assertEquals(stamped >= before, true);
  });

  await t.step('fails the whole export rather than silently omitting a table', async () => {
    const error = await assertRejects(
      () => buildAccountExport(fakeClient({}, 'garden_state')),
      AppError,
    );
    assertEquals((error as AppError).code, 'internal_error');
    assertEquals((error as AppError).details?.table, 'garden_state');
  });
});
