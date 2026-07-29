/**
 * Runtime entrypoint for the `health` function.
 *
 * Contains no logic by design — see `handler.ts`.
 */

import { handleHealth } from './handler.ts';

Deno.serve(handleHealth);
