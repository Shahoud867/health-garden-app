import { assertEquals, assertStringIncludes } from '@std/assert';
import { buildFallbackMessage } from './fallback-message.ts';

Deno.test('buildFallbackMessage', async (t) => {
  await t.step('encourages a brand-new user with no garden data', () => {
    const message = buildFallbackMessage([]);
    assertStringIncludes(message, "couldn't reach your coach");
  });

  await t.step('celebrates a high-stage goal (>= 6 days)', () => {
    const message = buildFallbackMessage([
      { goalType: 'hydration', plantType: 'mint', daysSucceededThisWeek: 6 },
    ]);
    assertStringIncludes(message, '6/7 days');
    assertStringIncludes(message, 'mint');
  });

  await t.step('encourages continued progress (3-5 days)', () => {
    const message = buildFallbackMessage([
      { goalType: 'protein', plantType: 'wheat_stalk', daysSucceededThisWeek: 4 },
    ]);
    assertStringIncludes(message, 'Good progress on protein');
  });

  await t.step('gently nudges on low activity (< 3 days)', () => {
    const message = buildFallbackMessage([
      { goalType: 'movement', plantType: 'sapling', daysSucceededThisWeek: 1 },
    ]);
    assertStringIncludes(message, 'still small');
  });

  await t.step('picks the best-performing goal across multiple', () => {
    const message = buildFallbackMessage([
      { goalType: 'movement', plantType: 'sapling', daysSucceededThisWeek: 1 },
      { goalType: 'hydration', plantType: 'mint', daysSucceededThisWeek: 6 },
    ]);
    assertStringIncludes(message, 'mint');
    assertEquals(message.includes('sapling'), false);
  });
});
