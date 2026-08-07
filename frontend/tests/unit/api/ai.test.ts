import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../helpers/mockSupabase'

const mockSupabase = vi.hoisted(() => {
  return { instance: null as ReturnType<typeof createSupabaseMock> | null }
})

vi.mock('../../../src/lib/supabase', () => ({
  get supabase() {
    return mockSupabase.instance
  },
}))

describe('lib/api/ai request shapes', () => {
  beforeEach(() => {
    mockSupabase.instance = createSupabaseMock()
  })

  it('sendChatMessage invokes ai-chat with {message} and unwraps {reply}', async () => {
    const { sendChatMessage } = await import('../../../src/lib/api/ai')
    mockSupabase.instance!.functions.invoke.mockResolvedValue({ data: { reply: 'Try a walk today.' }, error: null })

    const reply = await sendChatMessage('What should I eat?')
    expect(reply).toBe('Try a walk today.')
    expect(mockSupabase.instance!.functions.invoke).toHaveBeenCalledWith('ai-chat', {
      body: { message: 'What should I eat?' },
      method: undefined,
    })
  })

  it('generateAiPlan sends snake_case plan_type/regenerate_reason, matching the real Edge Function schema exactly', async () => {
    // ai-plan-generate's zod bodySchema (supabase/functions/_shared/validation/schema.ts)
    // is snake_case, unlike payments-submit-intent's camelCase -- this is
    // the one detail most likely to silently regress, so it's pinned here
    // rather than left to be caught the hard way in production.
    const { generateAiPlan } = await import('../../../src/lib/api/ai')
    mockSupabase.instance!.functions.invoke.mockResolvedValue({
      data: { plan: { text: 'Mon: dal chawal...' } },
      error: null,
    })

    const text = await generateAiPlan('diet', 'too_expensive')
    expect(text).toBe('Mon: dal chawal...')
    expect(mockSupabase.instance!.functions.invoke).toHaveBeenCalledWith('ai-plan-generate', {
      body: { plan_type: 'diet', regenerate_reason: 'too_expensive' },
      method: undefined,
    })
  })

  it('generateAiPlan omits regenerate_reason entirely when not regenerating (first generation)', async () => {
    const { generateAiPlan } = await import('../../../src/lib/api/ai')
    mockSupabase.instance!.functions.invoke.mockResolvedValue({ data: { plan: { text: 'plan' } }, error: null })

    await generateAiPlan('workout')
    const [, options] = mockSupabase.instance!.functions.invoke.mock.calls[0] as [string, { body: object }]
    expect(options.body).toEqual({ plan_type: 'workout' })
    expect(options.body).not.toHaveProperty('regenerate_reason')
  })

  it('getTodayAiChatUsage returns 0 (not an error) for a user with no usage row yet today', async () => {
    const { getTodayAiChatUsage } = await import('../../../src/lib/api/ai')
    mockSupabase.instance!.setTableResult('daily_ai_usage', { data: null, error: null })

    expect(await getTodayAiChatUsage('u1')).toBe(0)
  })

  it('getLatestAiPlan returns null, not a throw, when nothing has been generated yet', async () => {
    const { getLatestAiPlan } = await import('../../../src/lib/api/ai')
    mockSupabase.instance!.setTableResult('ai_plans', { data: null, error: null })

    expect(await getLatestAiPlan('u1', 'diet')).toBeNull()
  })
})
