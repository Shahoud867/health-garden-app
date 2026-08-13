/**
 * JazzCash Mobile Wallet integration (Blueprint ADR-008's "real-API path",
 * ADR-0028). Plain fetch + native Web Crypto HMAC, not a library (ADR-0023's
 * "not a protocol worth a dependency" reasoning, same posture as Turnstile
 * and the observability clients) -- HMAC-SHA256 over a salted, ordered field
 * string is straightforward with `crypto.subtle`, unlike Web Push's genuine
 * cryptographic protocol (VAPID JWT + AES-GCM), which is why that one *did*
 * pull in a real library.
 *
 * The request-side field order and hash algorithm below are not guessed --
 * they're taken from `zfhassaan/jazzcash` (github.com/zfhassaan/jazzcash,
 * MIT-licensed, MIT src/Payment.php::HashArray()), a real, tested,
 * published open-source implementation, cross-checked against JazzCash's
 * own public sandbox documentation (sandbox.jazzcash.com.pk) for the field
 * *names*. The response/webhook verification side is this module's own
 * best-evidence reconstruction of the same algorithm applied to the
 * response field set (JazzCash's own docs describe "fields sorted in
 * ascending alphabetical order" generally, but no public source verifies
 * the exact response field order the way the request side is verified) --
 * flagged explicitly in `verifyResponseHash`'s own doc comment. Confirm
 * against a real sandbox transaction before this goes anywhere near
 * production (see ADR-0028's go-live checklist).
 */

const ENCODER = new TextEncoder();

export interface JazzCashCredentials {
  readonly merchantId: string;
  readonly password: string;
  readonly integritySalt: string;
  /** 'sandbox' posts to JazzCash's test environment; 'production' posts real
   * money. Never inferred from APP_ENV -- an explicit, separate switch, so a
   * misconfigured deploy can't silently start charging real cards. */
  readonly mode: 'sandbox' | 'production';
}

const CHECKOUT_URL: Record<JazzCashCredentials['mode'], string> = {
  sandbox: 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/',
  production: 'https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/',
};

export function checkoutUrlFor(mode: JazzCashCredentials['mode']): string {
  return CHECKOUT_URL[mode];
}

async function hmacSha256Hex(message: string, key: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    ENCODER.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, ENCODER.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/** Formats a Date as JazzCash's YYYYMMDDHHmmss, in UTC (JazzCash's own
 * examples don't specify a timezone requirement beyond consistency between
 * pp_TxnDateTime and pp_TxnExpiryDateTime, so this app's usual
 * Asia/Karachi-local convention is deliberately not applied here). */
function formatJazzCashDateTime(date: Date): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`
  );
}

/** A real, unique transaction reference per checkout attempt -- how the
 * webhook callback is matched back to a payment_gateway_transactions row. */
export function generateTxnRefNo(now: Date = new Date()): string {
  const compact = formatJazzCashDateTime(now);
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
  return `T${compact}${suffix}`;
}

export interface CheckoutRequestFields {
  readonly pp_Amount: string;
  readonly pp_BankID: string;
  readonly pp_BillReference: string;
  readonly pp_Description: string;
  readonly pp_IsRegisteredCustomer: string;
  readonly pp_Language: string;
  readonly pp_MerchantID: string;
  readonly pp_Password: string;
  readonly pp_ProductID: string;
  readonly pp_ReturnURL: string;
  readonly pp_TxnCurrency: string;
  readonly pp_TxnDateTime: string;
  readonly pp_TxnExpiryDateTime: string;
  readonly pp_TxnRefNo: string;
  readonly pp_TxnType: string;
  readonly pp_Version: string;
  readonly pp_SecureHash: string;
}

/**
 * Exact field order from `zfhassaan/jazzcash`'s `HashArray()` (see this
 * module's own doc comment) -- alphabetical by field-name suffix for the
 * standard pp_* fields, with any ppmpf_* merchant custom fields trailing in
 * their own numeric order rather than merged alphabetically. This app sends
 * no ppmpf_* fields, so only the first block applies here, but the order is
 * kept explicit (not re-derived via `Object.keys().sort()`) so it can never
 * silently drift from the verified source if fields are added later.
 */
const REQUEST_HASH_FIELD_ORDER = [
  'pp_Amount',
  'pp_BillReference',
  'pp_Description',
  'pp_IsRegisteredCustomer',
  'pp_Language',
  'pp_MerchantID',
  'pp_Password',
  'pp_ReturnURL',
  'pp_TxnCurrency',
  'pp_TxnDateTime',
  'pp_TxnExpiryDateTime',
  'pp_TxnRefNo',
  'pp_TxnType',
  'pp_Version',
] as const;

function computeHash(
  fields: Record<string, string | undefined>,
  order: readonly string[],
  integritySalt: string,
): Promise<string> {
  const parts = [integritySalt];
  for (const key of order) {
    const value = fields[key];
    if (value !== undefined && value !== null && value !== '') {
      parts.push(value);
    }
  }
  return hmacSha256Hex(parts.join('&'), integritySalt);
}

export interface BuildCheckoutOptions {
  readonly credentials: JazzCashCredentials;
  readonly amountPkr: number;
  readonly txnRefNo: string;
  readonly billReference: string;
  readonly description: string;
  readonly returnUrl: string;
  readonly now?: Date;
  /** Minutes until the transaction expires -- JazzCash rejects a completed
   * checkout past this window. */
  readonly expiryMinutes?: number;
}

/** Builds the complete, signed field set for a JazzCash Mobile Wallet
 * hosted-checkout POST -- everything the frontend needs to auto-submit a
 * hidden form to `checkoutUrlFor(credentials.mode)`. Signing happens here,
 * server-side, so pp_Password and pp_MerchantID's authentication weight
 * never depends on the browser -- only the already-signed, ready-to-submit
 * field set reaches the client. */
export async function buildCheckoutFields(
  options: BuildCheckoutOptions,
): Promise<CheckoutRequestFields> {
  const { credentials, amountPkr, txnRefNo, billReference, description, returnUrl } = options;
  const now = options.now ?? new Date();
  const expiryMinutes = options.expiryMinutes ?? 60;
  const expiry = new Date(now.getTime() + expiryMinutes * 60 * 1000);

  const fields: Omit<CheckoutRequestFields, 'pp_SecureHash'> = {
    // Minor units (paisa) -- 299 PKR -> "29900", matching the sandbox docs'
    // own example ("875045 = Rs. 8,750.45").
    pp_Amount: String(Math.round(amountPkr * 100)),
    pp_BankID: '',
    pp_BillReference: billReference,
    pp_Description: description,
    pp_IsRegisteredCustomer: 'No',
    pp_Language: 'EN',
    pp_MerchantID: credentials.merchantId,
    pp_Password: credentials.password,
    pp_ProductID: '',
    pp_ReturnURL: returnUrl,
    pp_TxnCurrency: 'PKR',
    pp_TxnDateTime: formatJazzCashDateTime(now),
    pp_TxnExpiryDateTime: formatJazzCashDateTime(expiry),
    pp_TxnRefNo: txnRefNo,
    pp_TxnType: 'MWALLET',
    pp_Version: '1.1',
  };

  const pp_SecureHash = await computeHash(
    fields,
    REQUEST_HASH_FIELD_ORDER,
    credentials.integritySalt,
  );

  return { ...fields, pp_SecureHash };
}

export interface CheckoutCallbackFields {
  readonly pp_TxnRefNo?: string;
  readonly pp_Amount?: string;
  readonly pp_ResponseCode?: string;
  readonly pp_ResponseMessage?: string;
  readonly pp_TxnDateTime?: string;
  readonly pp_TxnCurrency?: string;
  readonly pp_BillReference?: string;
  readonly pp_RetreivalReferenceNo?: string;
  readonly pp_MerchantID?: string;
  readonly pp_AuthCode?: string;
  readonly pp_TxnType?: string;
  readonly pp_SecureHash?: string;
  readonly [key: string]: string | undefined;
}

/**
 * Verifies a callback's pp_SecureHash against every other pp_* field it
 * carries, alphabetically ordered -- JazzCash's own docs describe the
 * general algorithm as "fields sorted in ascending alphabetical order," but
 * no public source (unlike the request side) verifies the *exact* response
 * field order against real tested code. Treat a `true` result here as
 * strong evidence, not certainty, until it's been confirmed against one
 * real sandbox transaction (ADR-0028's go-live checklist) -- and this
 * fails closed either way: `payments-jazzcash-webhook` never activates a
 * subscription on a `false` result, full stop.
 */
export async function verifyResponseHash(
  fields: CheckoutCallbackFields,
  integritySalt: string,
): Promise<boolean> {
  const received = fields.pp_SecureHash;
  if (received === undefined || received.trim() === '') return false;

  const order = Object.keys(fields)
    .filter((key) => key !== 'pp_SecureHash')
    .sort((a, b) => a.localeCompare(b));

  const computed = await computeHash(fields, order, integritySalt);
  return computed.toUpperCase() === received.toUpperCase();
}

/** JazzCash's own convention: "000" is success, everything else is a
 * decline/error (Resources.html's response-code table). */
export function isSuccessResponseCode(code: string | undefined): boolean {
  return code === '000';
}
