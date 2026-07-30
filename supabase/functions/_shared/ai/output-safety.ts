/**
 * Output-pattern check (Blueprint §6.6 G-22, ADR-022) — the second of the two
 * prompt-injection defense layers. A pattern/keyword scan, not a second model
 * call (that would double the per-message cost, defeating ADR-003's whole
 * point). Explicitly best-effort: §14.4 records that a sufficiently creative
 * response could still slip past this, same as the system-prompt hardening.
 *
 * Three categories, matching §6.6's own examples: specific drug dosages,
 * diagnostic claims, and language that overrides the "consult a doctor"
 * disclaimer. A match routes the caller to `SAFE_FALLBACK_MESSAGE` instead of
 * the raw model output.
 */

const DOSAGE_PATTERN = /\b\d+(\.\d+)?\s?(mg|mcg|milligrams?|micrograms?|ml|milliliters?|iu)\b/i;

const DIAGNOSTIC_PATTERNS: readonly RegExp[] = [
  /\byou (have|are suffering from|are diagnosed with)\b/i,
  /\bthis (confirms|means) you have\b/i,
  /\byou (definitely|certainly) have\b/i,
];

const DISCLAIMER_OVERRIDE_PATTERNS: readonly RegExp[] = [
  /\byou (don'?t|do not) need (to see|a) (a )?doctor\b/i,
  /\bno need to (see|consult) a doctor\b/i,
  /\bignore (what|anything) your doctor\b/i,
  /\bas an ai,? i (can|will) (confirm|diagnose)\b/i,
];

export interface OutputSafetyResult {
  readonly safe: boolean;
  readonly matchedCategory?: 'dosage' | 'diagnostic' | 'disclaimer_override';
}

export const SAFE_FALLBACK_MESSAGE =
  "Let's keep this general: I can't give specific medical guidance, so for anything about diagnosis, medication, or treatment, please check with a qualified healthcare provider. I'm still here to help with your food and activity tracking.";

/** Scans a model response for red-flag phrasing before it reaches a user. */
export function checkOutputSafety(text: string): OutputSafetyResult {
  if (DOSAGE_PATTERN.test(text)) {
    return { safe: false, matchedCategory: 'dosage' };
  }
  if (DIAGNOSTIC_PATTERNS.some((pattern) => pattern.test(text))) {
    return { safe: false, matchedCategory: 'diagnostic' };
  }
  if (DISCLAIMER_OVERRIDE_PATTERNS.some((pattern) => pattern.test(text))) {
    return { safe: false, matchedCategory: 'disclaimer_override' };
  }
  return { safe: true };
}
