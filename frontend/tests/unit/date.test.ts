import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { todayLocalDate, localDateDaysAgo } from '../../src/lib/date'

describe('todayLocalDate / localDateDaysAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('formats the device-local date as YYYY-MM-DD', () => {
    vi.setSystemTime(new Date(2026, 2, 5)) // March 5 2026, local time
    expect(todayLocalDate()).toBe('2026-03-05')
  })

  it('zero-pads single-digit months and days', () => {
    vi.setSystemTime(new Date(2026, 0, 9)) // January 9 2026
    expect(todayLocalDate()).toBe('2026-01-09')
  })

  it('computes N days ago correctly within a month', () => {
    vi.setSystemTime(new Date(2026, 5, 15)) // June 15 2026
    expect(localDateDaysAgo(5)).toBe('2026-06-10')
  })

  it('rolls over a month/year boundary correctly', () => {
    vi.setSystemTime(new Date(2026, 0, 3)) // January 3 2026
    expect(localDateDaysAgo(5)).toBe('2025-12-29')
  })

  it('daysAgo=0 returns today', () => {
    vi.setSystemTime(new Date(2026, 2, 5))
    expect(localDateDaysAgo(0)).toBe(todayLocalDate())
  })
})
