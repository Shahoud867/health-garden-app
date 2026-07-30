/**
 * Parses the comma-separated `conditions` tag column (Blueprint §5.1's
 * deliberately simple tag-matching pattern, e.g. `users.conditions`) into a
 * clean array. Shared by anything that needs to hand a user's conditions to
 * the AI provider or a filtering query, so the parsing rule lives in one place.
 */
export function parseConditionsTag(raw: string | null | undefined): string[] {
  if (raw === null || raw === undefined) return [];
  return raw
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}
