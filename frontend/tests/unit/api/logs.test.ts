import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../helpers/mockSupabase'

const mockSupabase = vi.hoisted(() => {
  // Re-declared inline (not imported) -- vi.mock factories below run before
  // the module graph's regular imports resolve, so anything they reference
  // must come from vi.hoisted() itself, not a sibling import.
  return { instance: null as ReturnType<typeof createSupabaseMock> | null }
})

vi.mock('../../../src/lib/supabase', () => ({
  get supabase() {
    return mockSupabase.instance
  },
}))

describe('lib/api/logs', () => {
  beforeEach(() => {
    mockSupabase.instance = createSupabaseMock()
  })

  it('addFoodLog inserts with the caller-provided values and today as the default log_date', async () => {
    const { addFoodLog } = await import('../../../src/lib/api/logs')
    const inserted = { id: 1, user_id: 'u1' }
    mockSupabase.instance!.setTableResult('food_logs', { data: inserted, error: null })

    const result = await addFoodLog('u1', {
      foodId: 42,
      mealSlot: 'breakfast',
      quantity: 2,
      caloriesSnapshot: 320,
      proteinGSnapshot: 12,
      sugarFlagSnapshot: 'N',
    })

    expect(result).toEqual(inserted)
    const builder = mockSupabase.instance!.from.mock.results[0]!.value
    const insertCall = builder._calls.insert[0][0] as Record<string, unknown>
    expect(insertCall).toMatchObject({
      user_id: 'u1',
      food_id: 42,
      meal_slot: 'breakfast',
      quantity: 2,
      calories_snapshot: 320,
      protein_g_snapshot: 12,
      sugar_flag_snapshot: 'N',
      source: 'manual',
    })
    expect(insertCall.log_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(typeof insertCall.client_uuid).toBe('string')
  })

  it('addFoodLog defaults food_id/protein/sugar_flag to null when omitted', async () => {
    const { addFoodLog } = await import('../../../src/lib/api/logs')
    mockSupabase.instance!.setTableResult('food_logs', { data: {}, error: null })

    await addFoodLog('u1', { mealSlot: 'snack', quantity: 1, caloriesSnapshot: 100 })

    const builder = mockSupabase.instance!.from.mock.results[0]!.value
    const insertCall = builder._calls.insert[0][0] as Record<string, unknown>
    expect(insertCall.food_id).toBeNull()
    expect(insertCall.protein_g_snapshot).toBeNull()
    expect(insertCall.sugar_flag_snapshot).toBeNull()
  })

  it('upsertWeightLog upserts on (user_id, log_date) so logging twice the same day overwrites, not duplicates', async () => {
    const { upsertWeightLog } = await import('../../../src/lib/api/logs')
    mockSupabase.instance!.setTableResult('weight_logs', { data: { weight_kg: 70 }, error: null })

    await upsertWeightLog('u1', 70.5, '2026-03-01')

    const builder = mockSupabase.instance!.from.mock.results[0]!.value
    const [payload, options] = builder._calls.upsert[0] as [Record<string, unknown>, Record<string, unknown>]
    expect(payload).toMatchObject({ user_id: 'u1', log_date: '2026-03-01', weight_kg: 70.5 })
    expect(options).toEqual({ onConflict: 'user_id,log_date' })
  })

  it('getTodayWaterGlasses sums glasses_logged across multiple rows for the day', async () => {
    const { getTodayWaterGlasses } = await import('../../../src/lib/api/logs')
    mockSupabase.instance!.setTableResult('water_logs', {
      data: [{ glasses_logged: 1 }, { glasses_logged: 1 }, { glasses_logged: 2 }],
      error: null,
    })

    const total = await getTodayWaterGlasses('u1', '2026-03-01')
    expect(total).toBe(4)
  })

  it('getTodayWaterGlasses returns 0, not NaN or an error, when no rows exist', async () => {
    const { getTodayWaterGlasses } = await import('../../../src/lib/api/logs')
    mockSupabase.instance!.setTableResult('water_logs', { data: [], error: null })

    expect(await getTodayWaterGlasses('u1', '2026-03-01')).toBe(0)
  })

  it('removeLastWaterGlass is a silent no-op when there is nothing to remove', async () => {
    const { removeLastWaterGlass } = await import('../../../src/lib/api/logs')
    mockSupabase.instance!.setTableResult('water_logs', { data: [], error: null })

    await expect(removeLastWaterGlass('u1', '2026-03-01')).resolves.toBeUndefined()
    // Only the initial select ran -- no delete call, since there was nothing found.
    const builder = mockSupabase.instance!.from.mock.results[0]!.value
    expect(builder._calls.delete).toBeUndefined()
  })

  it('a Postgres error on any call is thrown as a normalized AppError, not the raw Postgrest error', async () => {
    const { addFoodLog } = await import('../../../src/lib/api/logs')
    mockSupabase.instance!.setTableResult('food_logs', {
      data: null,
      error: { message: 'value too long', code: '23514' },
    })

    await expect(
      addFoodLog('u1', { mealSlot: 'lunch', quantity: 1, caloriesSnapshot: 100 }),
    ).rejects.toMatchObject({ name: 'AppError' })
  })
})
