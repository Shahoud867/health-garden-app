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

describe('lib/api/payments', () => {
  beforeEach(() => {
    mockSupabase.instance = createSupabaseMock()
  })

  it('submitPaymentIntent sends camelCase fields, matching payments-submit-intent\'s real zod schema exactly', async () => {
    // Unlike ai-plan-generate (snake_case), payments-submit-intent's
    // bodySchema (supabase/functions/payments-submit-intent/handler.ts) is
    // camelCase -- the two Edge Functions are genuinely inconsistent with
    // each other, so getting either one wrong by copying the other's
    // convention is an easy, silent mistake. Pinned here per-endpoint.
    const { submitPaymentIntent } = await import('../../../src/lib/api/payments')
    mockSupabase.instance!.functions.invoke.mockResolvedValue({
      data: { intentId: 7, status: 'pending_review' },
      error: null,
    })

    const result = await submitPaymentIntent(299, 'jazzcash_manual', 'TXN123', 'turnstile-token-abc')

    expect(result).toEqual({ intentId: 7, status: 'pending_review' })
    expect(mockSupabase.instance!.functions.invoke).toHaveBeenCalledWith('payments-submit-intent', {
      body: {
        amountPkr: 299,
        method: 'jazzcash_manual',
        reference: 'TXN123',
        turnstileToken: 'turnstile-token-abc',
      },
      method: undefined,
    })
  })

  it('getActiveSubscription filters to status=active and returns null when there is none', async () => {
    const { getActiveSubscription } = await import('../../../src/lib/api/payments')
    mockSupabase.instance!.setTableResult('subscriptions', { data: null, error: null })

    const result = await getActiveSubscription('u1')

    expect(result).toBeNull()
    const builder = mockSupabase.instance!.from.mock.results[0]!.value
    expect(builder._calls.eq).toContainEqual(['status', 'active'])
  })
})
