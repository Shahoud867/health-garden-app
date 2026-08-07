import { describe, expect, it } from 'vitest'
import { AuthApiError } from '@supabase/supabase-js'
import { AppError, normalizeError } from '../../src/lib/errors'

describe('normalizeError', () => {
  it('passes an existing AppError through unchanged', () => {
    const original = new AppError('daily_cap_reached', 'You have reached today\'s limit.')
    expect(normalizeError(original)).toBe(original)
  })

  it('humanizes a known Supabase Auth error code', () => {
    const authErr = new AuthApiError('Invalid login credentials', 400, 'invalid_credentials')
    const result = normalizeError(authErr)
    expect(result).toBeInstanceOf(AppError)
    expect(result.code).toBe('invalid_credentials')
    expect(result.message).toBe('That email or password is incorrect.')
  })

  it('falls back to the raw message for an unmapped Auth error code', () => {
    const authErr = new AuthApiError('Some new Supabase error', 500, 'something_new')
    const result = normalizeError(authErr)
    expect(result.code).toBe('something_new')
    expect(result.message).toBe('Some new Supabase error')
  })

  it('humanizes a Postgres unique-violation (23505) without leaking SQL', () => {
    const pgErr = { message: 'duplicate key value violates unique constraint', code: '23505' }
    const result = normalizeError(pgErr)
    expect(result.message).toBe('That entry already exists.')
    expect(result.message).not.toMatch(/constraint|SQL/i)
  })

  it('humanizes an RLS-denial error (42501) as a permission message', () => {
    const pgErr = { message: 'new row violates row-level security policy', code: '42501' }
    const result = normalizeError(pgErr)
    expect(result.message).toBe("You don't have permission to do that.")
  })

  it('recognizes PostgREST\'s own RLS-denial code (PGRST301)', () => {
    const pgErr = { message: 'JWT expired', code: 'PGRST301' }
    const result = normalizeError(pgErr)
    expect(result.message).toBe("You don't have permission to do that.")
  })

  it('maps a "Failed to fetch" TypeError to a network_error code', () => {
    const result = normalizeError(new TypeError('Failed to fetch'))
    expect(result.code).toBe('network_error')
    expect(result.message).toMatch(/connection/i)
  })

  it('falls back to the error message for an unrecognized plain Error', () => {
    const result = normalizeError(new Error('Something specific broke'))
    expect(result.code).toBe('unknown_error')
    expect(result.message).toBe('Something specific broke')
  })

  it('never throws on a totally malformed input', () => {
    expect(() => normalizeError(null)).not.toThrow()
    expect(() => normalizeError(undefined)).not.toThrow()
    expect(() => normalizeError(42)).not.toThrow()
    expect(normalizeError('a bare string').code).toBe('unknown_error')
  })
})
