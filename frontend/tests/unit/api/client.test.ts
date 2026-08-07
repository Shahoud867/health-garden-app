import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { createSupabaseMock } from '../helpers/mockSupabase'

const mockSupabase = vi.hoisted(() => {
  return { instance: null as ReturnType<typeof createSupabaseMock> | null }
})

vi.mock('../../../src/lib/supabase', () => ({
  get supabase() {
    return mockSupabase.instance
  },
}))

describe('invokeFunction', () => {
  beforeEach(() => {
    mockSupabase.instance = createSupabaseMock()
  })

  it('returns the response data on success', async () => {
    const { invokeFunction } = await import('../../../src/lib/api/client')
    mockSupabase.instance!.functions.invoke.mockResolvedValue({ data: { reply: 'hi' }, error: null })

    const result = await invokeFunction<{ reply: string }>('ai-chat', { message: 'hello' })
    expect(result).toEqual({ reply: 'hi' })
    expect(mockSupabase.instance!.functions.invoke).toHaveBeenCalledWith('ai-chat', {
      body: { message: 'hello' },
      method: undefined,
    })
  })

  it("parses an Edge Function's {error, message} JSON body out of a FunctionsHttpError", async () => {
    const { invokeFunction } = await import('../../../src/lib/api/client')
    const fakeResponse = { json: () => Promise.resolve({ error: 'daily_cap_reached', message: "You've hit today's limit." }) }
    mockSupabase.instance!.functions.invoke.mockResolvedValue({
      data: null,
      error: new FunctionsHttpError(fakeResponse),
    })

    await expect(invokeFunction('ai-chat', { message: 'hi' })).rejects.toMatchObject({
      name: 'AppError',
      code: 'daily_cap_reached',
      message: "You've hit today's limit.",
    })
  })

  it("falls back to error_error's generic code if the Edge Function body has no error field", async () => {
    const { invokeFunction } = await import('../../../src/lib/api/client')
    const fakeResponse = { json: () => Promise.resolve({ message: 'Something broke' }) }
    mockSupabase.instance!.functions.invoke.mockResolvedValue({
      data: null,
      error: new FunctionsHttpError(fakeResponse),
    })

    await expect(invokeFunction('ai-chat', {})).rejects.toMatchObject({
      code: 'function_error',
      message: 'Something broke',
    })
  })

  it('falls back to the generic normalizer when the error body is not valid JSON (e.g. a gateway HTML page)', async () => {
    const { invokeFunction } = await import('../../../src/lib/api/client')
    const fakeResponse = { json: () => Promise.reject(new Error('Unexpected token <')) }
    mockSupabase.instance!.functions.invoke.mockResolvedValue({
      data: null,
      error: new FunctionsHttpError(fakeResponse),
    })

    await expect(invokeFunction('ai-chat', {})).rejects.toMatchObject({ name: 'AppError' })
  })

  it('throws empty_response when the function reports no error but returns no data either', async () => {
    const { invokeFunction } = await import('../../../src/lib/api/client')
    mockSupabase.instance!.functions.invoke.mockResolvedValue({ data: null, error: null })

    await expect(invokeFunction('health')).rejects.toMatchObject({ code: 'empty_response' })
  })

  it('passes through a GET method override for account-export', async () => {
    const { invokeFunction } = await import('../../../src/lib/api/client')
    mockSupabase.instance!.functions.invoke.mockResolvedValue({ data: { exportedAt: 'now', data: {} }, error: null })

    await invokeFunction('account-export', undefined, { method: 'GET' })
    expect(mockSupabase.instance!.functions.invoke).toHaveBeenCalledWith('account-export', {
      body: undefined,
      method: 'GET',
    })
  })
})
