import { describe, expect, it } from 'vitest'
import { GOAL_TYPE_TO_PLANT, GOAL_TYPE_ORDER, goalLabel } from '../../src/lib/gardenMapping'
import type { GoalType } from '../../src/lib/database.types'

const ALL_GOAL_TYPES: GoalType[] = ['hydration', 'sugar_free', 'protein', 'movement', 'consistency']

describe('GOAL_TYPE_TO_PLANT', () => {
  it('has exactly one mapping for every goal_type the database recognizes', () => {
    expect(Object.keys(GOAL_TYPE_TO_PLANT).sort()).toEqual([...ALL_GOAL_TYPES].sort())
  })

  it('reproduces the exact pre-integration mock pairing (App.tsx INITIAL_STATE.garden)', () => {
    // This mapping is load-bearing for visual identity, not arbitrary --
    // see the module's own doc comment. Pinning it here means a future edit
    // that quietly changes a pairing gets caught immediately.
    expect(GOAL_TYPE_TO_PLANT).toEqual({
      hydration: 'bellflower',
      sugar_free: 'cactus',
      protein: 'bamboo',
      movement: 'sunflower',
      consistency: 'succulent',
    })
  })

  it('maps every goal_type to a distinct plant (no two goals share art)', () => {
    const plants = Object.values(GOAL_TYPE_TO_PLANT)
    expect(new Set(plants).size).toBe(plants.length)
  })
})

describe('GOAL_TYPE_ORDER', () => {
  it('is a permutation of every real goal_type, not a subset', () => {
    expect([...GOAL_TYPE_ORDER].sort()).toEqual([...ALL_GOAL_TYPES].sort())
  })
})

describe('goalLabel', () => {
  it('returns a distinct, non-empty label for every goal_type in both languages', () => {
    for (const goalType of ALL_GOAL_TYPES) {
      const en = goalLabel(goalType, 'en')
      const ur = goalLabel(goalType, 'ur')
      expect(en.length).toBeGreaterThan(0)
      expect(ur.length).toBeGreaterThan(0)
      expect(en).not.toBe(ur)
    }
  })
})
