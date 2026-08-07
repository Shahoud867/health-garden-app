/**
 * Today's date as this device perceives it, `YYYY-MM-DD`.
 *
 * Deliberately the *device's* local date, not a hardcoded Asia/Karachi
 * offset: unlike the DB-test-suite helper of the same intent (backend
 * `karachiToday()`, which exists to match Postgres's pinned
 * `CURRENT_DATE`), a log a person enters is dated by what day *they*
 * believe it is right now, wherever they physically are — the natural
 * expectation for a habit tracker, and consistent with §4.4's offline-first
 * design (a log always carries the date the user meant, synced later).
 * `daily_goal_success` (migration 0005) still evaluates *its own* range in
 * Asia/Karachi server-side regardless of what date a client sends.
 */
export function todayLocalDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** `YYYY-MM-DD` for `daysAgo` days before today, device-local. */
export function localDateDaysAgo(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
