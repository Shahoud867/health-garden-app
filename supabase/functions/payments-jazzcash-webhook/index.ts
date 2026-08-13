import { handlePaymentsJazzCashWebhook } from './handler.ts';

Deno.serve(handlePaymentsJazzCashWebhook);
