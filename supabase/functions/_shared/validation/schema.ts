/**
 * Reusable validation primitives (Blueprint §6.3).
 *
 * Domain constraints are defined once here rather than restated per endpoint, so
 * that a rule like "a log date may not be in the future" cannot be enforced in
 * one place and forgotten in another. These mirror the Postgres CHECK
 * constraints introduced in Phase 3 (Database Layer) — validation at the edge
 * for a clear error message, constraints in the database for the actual
 * guarantee.
 */

import { z } from '../deps.ts';

/** UUID v4 generated on-device, used for idempotent sync (Blueprint ADR-004). */
export const clientUuidSchema = z.string().uuid({ message: 'client_uuid must be a valid UUID' });

/** ISO calendar date (`YYYY-MM-DD`), the storage format for all `*_date` columns. */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' })
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'Date is not a real calendar date',
  });

/**
 * A log date that is not in the future.
 *
 * Backdating is permitted without bound: an offline-first client may sync days
 * or weeks of history after a period without connectivity (Blueprint §4.4), so
 * a lower bound here would silently discard legitimate data. Future dates are
 * rejected because they would corrupt the garden's weekly aggregation window.
 *
 * A generous tolerance absorbs device clock skew and timezone edges — the
 * client computes dates locally while the database timezone is pinned to
 * Asia/Karachi (Blueprint §5.10, G-16), not UTC.
 */
export const pastOrPresentDateSchema = isoDateSchema.refine(
  (value) => {
    const parsed = new Date(`${value}T00:00:00Z`).getTime();
    const tolerance = 36 * 60 * 60 * 1000; // 36h
    return parsed <= Date.now() + tolerance;
  },
  { message: 'Date cannot be in the future' },
);

/** Meal slots used by the tracking diary (Blueprint §5.2 `food_logs.meal_slot`). */
export const mealSlotSchema = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);

/**
 * Provenance of a logged row (Blueprint §11.2 `source` column).
 *
 * Present from the first migration so a future wearable integration is an
 * additive adapter rather than a schema migration on the highest-volume tables.
 */
export const logSourceSchema = z.enum(['manual', 'wearable', 'import']).default('manual');

/** Goal identifiers backing the five launch plants (Blueprint §5.3). */
export const goalTypeSchema = z.enum([
  'hydration',
  'sugar_free',
  'protein',
  'movement',
  'consistency',
]);

/** Health conditions used for exercise and recipe exclusion (Blueprint §1.3 FR-8). */
export const conditionSchema = z.enum([
  'diabetes',
  'pcos',
  'hypertension',
  'knee_pain',
  'back_pain',
  'pregnancy',
]);

/** Positive quantity with two decimals, matching `DECIMAL(6,2)` in the schema. */
export const quantitySchema = z
  .number()
  .positive({ message: 'Quantity must be greater than zero' })
  .max(9999.99, { message: 'Quantity is unrealistically large' });

/**
 * Cursor-style pagination (Blueprint §6.1).
 *
 * The `limit` ceiling of 100 matches PostgREST's configured `max_rows` guard in
 * config.toml, keeping a single effective bound rather than two that can drift.
 */
export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type MealSlot = z.infer<typeof mealSlotSchema>;
export type LogSource = z.infer<typeof logSourceSchema>;
export type GoalType = z.infer<typeof goalTypeSchema>;
export type Condition = z.infer<typeof conditionSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
