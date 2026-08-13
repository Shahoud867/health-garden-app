import { assertEquals, assertNotEquals } from '@std/assert';
import {
  buildCheckoutFields,
  checkoutUrlFor,
  generateTxnRefNo,
  isSuccessResponseCode,
  verifyResponseHash,
} from './jazzcash.ts';

const CREDENTIALS = {
  merchantId: 'MC12345',
  password: 'pw12345',
  integritySalt: 'saltsalt1234',
  mode: 'sandbox' as const,
};

Deno.test('checkoutUrlFor', async (t) => {
  await t.step('resolves distinct sandbox and production URLs', () => {
    assertNotEquals(checkoutUrlFor('sandbox'), checkoutUrlFor('production'));
    assertEquals(checkoutUrlFor('sandbox').includes('sandbox'), true);
  });
});

Deno.test('generateTxnRefNo', async (t) => {
  await t.step('is unique across calls at the same instant', () => {
    const now = new Date('2026-08-13T10:00:00.000Z');
    const first = generateTxnRefNo(now);
    const second = generateTxnRefNo(now);
    assertNotEquals(first, second);
  });

  await t.step('embeds a compact YYYYMMDDHHmmss timestamp', () => {
    const ref = generateTxnRefNo(new Date('2026-08-13T10:05:07.000Z'));
    assertEquals(ref.startsWith('T20260813100507'), true);
  });
});

Deno.test('buildCheckoutFields', async (t) => {
  await t.step('converts PKR to paisa (minor units)', async () => {
    const fields = await buildCheckoutFields({
      credentials: CREDENTIALS,
      amountPkr: 299,
      txnRefNo: 'T20260813100507ABC123',
      billReference: 'T20260813100507ABC123',
      description: 'Health Garden Premium — 30 days',
      returnUrl: 'https://example.supabase.co/functions/v1/payments-jazzcash-webhook',
      now: new Date('2026-08-13T10:00:00.000Z'),
    });
    assertEquals(fields.pp_Amount, '29900');
  });

  await t.step('produces a hash that changes when any signed field changes', async () => {
    const base = {
      credentials: CREDENTIALS,
      amountPkr: 299,
      txnRefNo: 'T20260813100507ABC123',
      billReference: 'T20260813100507ABC123',
      description: 'Health Garden Premium — 30 days',
      returnUrl: 'https://example.supabase.co/functions/v1/payments-jazzcash-webhook',
      now: new Date('2026-08-13T10:00:00.000Z'),
    };
    const original = await buildCheckoutFields(base);
    const tamperedAmount = await buildCheckoutFields({ ...base, amountPkr: 1 });
    const tamperedRef = await buildCheckoutFields({ ...base, txnRefNo: 'T-different' });

    assertNotEquals(original.pp_SecureHash, tamperedAmount.pp_SecureHash);
    assertNotEquals(original.pp_SecureHash, tamperedRef.pp_SecureHash);
  });

  await t.step('is deterministic for identical inputs', async () => {
    const options = {
      credentials: CREDENTIALS,
      amountPkr: 299,
      txnRefNo: 'T20260813100507ABC123',
      billReference: 'T20260813100507ABC123',
      description: 'Health Garden Premium — 30 days',
      returnUrl: 'https://example.supabase.co/functions/v1/payments-jazzcash-webhook',
      now: new Date('2026-08-13T10:00:00.000Z'),
    };
    const first = await buildCheckoutFields(options);
    const second = await buildCheckoutFields(options);
    assertEquals(first, second);
  });

  await t.step('sets a later expiry than the transaction datetime', async () => {
    const now = new Date('2026-08-13T10:00:00.000Z');
    const fields = await buildCheckoutFields({
      credentials: CREDENTIALS,
      amountPkr: 299,
      txnRefNo: 'T1',
      billReference: 'T1',
      description: 'test',
      returnUrl: 'https://example.com/cb',
      now,
      expiryMinutes: 30,
    });
    assertEquals(fields.pp_TxnDateTime, '20260813100000');
    assertEquals(fields.pp_TxnExpiryDateTime, '20260813103000');
  });
});

Deno.test('verifyResponseHash', async (t) => {
  await t.step('round-trips: a hash produced by the same salted-sort scheme verifies', async () => {
    // Simulates what a real JazzCash callback would look like -- fields
    // hashed here using the same "salt + alphabetical fields, non-empty
    // only" scheme `verifyResponseHash` itself checks against, since no
    // real callback sample is available to fixture against directly (see
    // this module's own doc comment: the response side is unverified
    // against real JazzCash source, unlike the request side).
    const salt = 'saltsalt1234';
    const unsigned = {
      pp_TxnRefNo: 'T20260813100507ABC123',
      pp_Amount: '29900',
      pp_ResponseCode: '000',
      pp_ResponseMessage: 'Success',
      pp_TxnCurrency: 'PKR',
    };
    const order = Object.keys(unsigned).sort((a, b) => a.localeCompare(b));
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(salt),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const message = [salt, ...order.map((k) => (unsigned as Record<string, string>)[k])].join(
      '&',
    );
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
    const hash = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();

    const valid = await verifyResponseHash({ ...unsigned, pp_SecureHash: hash }, salt);
    assertEquals(valid, true);
  });

  await t.step('fails closed when the hash does not match', async () => {
    const valid = await verifyResponseHash(
      {
        pp_TxnRefNo: 'T1',
        pp_ResponseCode: '000',
        pp_SecureHash: 'not-a-real-hash',
      },
      'saltsalt1234',
    );
    assertEquals(valid, false);
  });

  await t.step('fails closed when pp_SecureHash is missing entirely', async () => {
    const valid = await verifyResponseHash(
      { pp_TxnRefNo: 'T1', pp_ResponseCode: '000' },
      'saltsalt1234',
    );
    assertEquals(valid, false);
  });

  await t.step('fails closed when pp_SecureHash is blank', async () => {
    const valid = await verifyResponseHash(
      { pp_TxnRefNo: 'T1', pp_SecureHash: '   ' },
      'saltsalt1234',
    );
    assertEquals(valid, false);
  });

  await t.step('detects tampering with a single field after signing', async () => {
    const salt = 'saltsalt1234';
    const signed = { pp_TxnRefNo: 'T1', pp_Amount: '100', pp_ResponseCode: '000' };
    const order = Object.keys(signed).sort((a, b) => a.localeCompare(b));
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(salt),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const message = [salt, ...order.map((k) => (signed as Record<string, string>)[k])].join('&');
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
    const hash = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();

    // Amount tampered after the hash was computed -- must not verify.
    const valid = await verifyResponseHash(
      { ...signed, pp_Amount: '999999', pp_SecureHash: hash },
      salt,
    );
    assertEquals(valid, false);
  });
});

Deno.test('isSuccessResponseCode', async (t) => {
  await t.step('treats exactly "000" as success', () => {
    assertEquals(isSuccessResponseCode('000'), true);
  });

  await t.step('treats every other code, and undefined, as not success', () => {
    assertEquals(isSuccessResponseCode('121'), false);
    assertEquals(isSuccessResponseCode(''), false);
    assertEquals(isSuccessResponseCode(undefined), false);
  });
});
