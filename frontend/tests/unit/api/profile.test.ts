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

describe('lib/api/profile', () => {
  beforeEach(() => {
    mockSupabase.instance = createSupabaseMock()
  })

  it('getProfile filters by auth_id (auth.users.id), never by the profile row\'s own id', async () => {
    // Regression guard for a real bug caught this session: every log
    // table's user_id references users.id, a *different* UUID from
    // session.user.id/auth_id. getProfile is the one function that
    // legitimately takes the auth id -- it's the lookup that resolves one
    // into the other -- so this pins that it queries the right column.
    const { getProfile } = await import('../../../src/lib/api/profile')
    mockSupabase.instance!.setTableResult('users', { data: { id: 'profile-uuid', auth_id: 'auth-uuid' }, error: null })

    await getProfile('auth-uuid')

    const builder = mockSupabase.instance!.from.mock.results[0]!.value
    expect(builder._calls.eq[0]).toEqual(['auth_id', 'auth-uuid'])
  })

  it('updateProfile filters by auth_id and returns the updated row', async () => {
    const { updateProfile } = await import('../../../src/lib/api/profile')
    const updated = { id: 'profile-uuid', full_name: 'Ayesha' }
    mockSupabase.instance!.setTableResult('users', { data: updated, error: null })

    const result = await updateProfile('auth-uuid', { full_name: 'Ayesha' })

    expect(result).toEqual(updated)
    const builder = mockSupabase.instance!.from.mock.results[0]!.value
    expect(builder._calls.update[0][0]).toEqual({ full_name: 'Ayesha' })
    expect(builder._calls.eq[0]).toEqual(['auth_id', 'auth-uuid'])
  })
})
