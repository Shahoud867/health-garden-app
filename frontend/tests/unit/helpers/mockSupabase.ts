import { vi } from 'vitest'

/**
 * A minimal stand-in for supabase-js's chainable PostgREST query builder.
 * Every filter/modifier method returns the same object so any chain length
 * works (`.from(x).select().eq().order().limit()`, etc.); awaiting the
 * chain (or calling `.single()`/`.maybeSingle()`) resolves to whatever
 * `result` was configured with. Records every call for assertions.
 */
export function createQueryBuilderMock(result: { data: unknown; error: unknown }) {
  const calls: Record<string, unknown[][]> = {}
  const record = (name: string, args: unknown[]) => {
    calls[name] = calls[name] ?? []
    calls[name].push(args)
  }

  const chain = (name: string) =>
    vi.fn((...args: unknown[]) => {
      record(name, args)
      return builder
    })

  const builder: Record<string, unknown> = {
    select: chain('select'),
    insert: chain('insert'),
    update: chain('update'),
    upsert: chain('upsert'),
    delete: chain('delete'),
    eq: chain('eq'),
    in: chain('in'),
    or: chain('or'),
    ilike: chain('ilike'),
    order: chain('order'),
    limit: chain('limit'),
    single: vi.fn((...args: unknown[]) => {
      record('single', args)
      return Promise.resolve(result)
    }),
    maybeSingle: vi.fn((...args: unknown[]) => {
      record('maybeSingle', args)
      return Promise.resolve(result)
    }),
    // Makes the builder itself awaitable, matching real supabase-js
    // query builders (a `PromiseLike`) for call sites that never call
    // .single()/.maybeSingle() and just `await` the chain directly.
    then: (resolve: (value: typeof result) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
    _calls: calls,
  }

  return builder
}

export function createSupabaseMock() {
  const fromResults = new Map<string, { data: unknown; error: unknown }>()
  const fromMock = vi.fn((table: string) => {
    const result = fromResults.get(table) ?? { data: null, error: null }
    return createQueryBuilderMock(result)
  })

  return {
    from: fromMock,
    /** Configure what `.from(table)` should resolve to for this test. */
    setTableResult(table: string, result: { data: unknown; error: unknown }) {
      fromResults.set(table, result)
    },
    functions: {
      invoke: vi.fn(),
    },
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      resend: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  }
}
