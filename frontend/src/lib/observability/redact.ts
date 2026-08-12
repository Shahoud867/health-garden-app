/**
 * Mirrors the backend's `_shared/observability/logger.ts` `redact()` --
 * duplicated, not imported, because the Deno Edge Function runtime and this
 * Vite/browser bundle share no code today (different toolchains entirely;
 * this repo has never had a shared package between them). Kept in sync by
 * hand; the field list matters more than the mechanism, and it's short.
 *
 * Same reason to exist here as there: an analytics/error-reporting event is
 * still a place a diagnosed condition, a raw weight value, or an email must
 * never end up (Blueprint NFR-6) -- redaction happens before anything
 * leaves the browser, not as a server-side afterthought.
 */

const REDACTED_KEY_PATTERNS: readonly string[] = [
  // Credentials and secrets
  "password",
  "token",
  "secret",
  "apikey",
  "api_key",
  "authorization",
  "jwt",
  "session",
  // Direct identifiers
  "email",
  "phone",
  "full_name",
  "fullname",
  "avatar",
  // Health and body data (Blueprint NFR-6)
  "condition",
  "weight",
  "height",
  "symptom",
  "severity",
  "diagnosis",
  "bmr",
  "notes",
  // Financial
  "card",
  "cvv",
  "account_number",
]

const REDACTED_PLACEHOLDER = "[redacted]"
const MAX_REDACTION_DEPTH = 6
const MAX_STRING_LENGTH = 512

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase()
  return REDACTED_KEY_PATTERNS.some((pattern) => normalized.includes(pattern))
}

function redactValue(value: unknown, depth: number): unknown {
  if (depth > MAX_REDACTION_DEPTH) return "[max depth]"
  if (typeof value === "string") {
    return value.length > MAX_STRING_LENGTH
      ? `${value.slice(0, MAX_STRING_LENGTH)}…`
      : value
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, depth + 1))
  }
  if (value !== null && typeof value === "object") {
    return redact(value as Record<string, unknown>, depth + 1)
  }
  return value
}

export function redact(
  obj: Record<string, unknown>,
  depth = 0,
): Record<string, unknown> {
  if (depth > MAX_REDACTION_DEPTH) return { "[max depth]": true }
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    out[key] = isSensitiveKey(key)
      ? REDACTED_PLACEHOLDER
      : redactValue(value, depth + 1)
  }
  return out
}
