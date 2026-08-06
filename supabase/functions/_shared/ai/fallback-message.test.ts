import { assertEquals, assertStringIncludes } from '@std/assert';
import { buildFallbackMessage } from './fallback-message.ts';

Deno.test('buildFallbackMessage', async (t) => {
  await t.step('encourages a brand-new user with no garden data', () => {
    const message = buildFallbackMessage([]);
    assertStringIncludes(message, "couldn't reach your coach");
  });

  await t.step('celebrates a plant one day from fully grown (stage 2)', () => {
    const message = buildFallbackMessage([
      { goalType: 'hydration', plantType: 'mint', currentStage: 2 },
    ]);
    assertStringIncludes(message, 'one more day');
    assertStringIncludes(message, 'mint');
  });

  await t.step('encourages continued progress (stage 1)', () => {
    const message = buildFallbackMessage([
      { goalType: 'protein', plantType: 'wheat_stalk', currentStage: 1 },
    ]);
    assertStringIncludes(message, 'Good progress on protein');
  });

  await t.step('gently nudges on a freshly started cycle (stage 0)', () => {
    const message = buildFallbackMessage([
      { goalType: 'movement', plantType: 'sapling', currentStage: 0 },
    ]);
    assertStringIncludes(message, 'just getting started');
  });

  await t.step('picks the plant furthest into its cycle across multiple', () => {
    const message = buildFallbackMessage([
      { goalType: 'movement', plantType: 'sapling', currentStage: 0 },
      { goalType: 'hydration', plantType: 'mint', currentStage: 2 },
    ]);
    assertStringIncludes(message, 'mint');
    assertEquals(message.includes('sapling'), false);
  });
});
