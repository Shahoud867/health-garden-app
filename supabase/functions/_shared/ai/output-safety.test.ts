import { assertEquals } from '@std/assert';
import { checkOutputSafety, SAFE_FALLBACK_MESSAGE } from './output-safety.ts';

Deno.test('checkOutputSafety', async (t) => {
  await t.step('passes ordinary coaching advice', () => {
    const result = checkOutputSafety(
      'Try adding a source of protein at breakfast and a short walk after dinner.',
    );
    assertEquals(result, { safe: true });
  });

  await t.step('flags a specific drug dosage', () => {
    const result = checkOutputSafety('Take 500mg of metformin twice a day.');
    assertEquals(result.safe, false);
    assertEquals(result.matchedCategory, 'dosage');
  });

  await t.step('flags a diagnostic claim', () => {
    const result = checkOutputSafety('Based on what you told me, you have type 2 diabetes.');
    assertEquals(result.safe, false);
    assertEquals(result.matchedCategory, 'diagnostic');
  });

  await t.step('flags disclaimer-overriding language', () => {
    const result = checkOutputSafety("You don't need to see a doctor for that, just rest.");
    assertEquals(result.safe, false);
    assertEquals(result.matchedCategory, 'disclaimer_override');
  });

  await t.step('SAFE_FALLBACK_MESSAGE never itself trips the check', () => {
    assertEquals(checkOutputSafety(SAFE_FALLBACK_MESSAGE).safe, true);
  });
});
