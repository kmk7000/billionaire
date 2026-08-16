// Parsing/formatting for the account's own 携帯電話番号 (設定 > 携帯電話番号変更).
//
// Distinct from src/utils/phoneNumber.ts on purpose: that one converts numbers
// written on someone else's business card into the digits-only E.164 form iOS's
// call directory demands, and deliberately drops anything ambiguous. This one
// handles a single number the user types about themselves, so it keeps the
// domestic form people actually read and write, and has to explain *why* an
// entry was rejected instead of silently discarding it.

/** Japanese mobile prefixes. 050 is IP telephony and 0120 toll-free — neither
    is a 携帯電話番号, and accepting them here would make the label a lie. */
const MOBILE_PREFIXES = ['070', '080', '090'];
const MOBILE_DIGITS = 11;

/**
 * Digits as stored: domestic form, no separators (e.g. `09012345678`).
 *
 * Accepts what people actually paste — hyphens, spaces, full-width digits,
 * parens, and the `+81`/`0081` international forms, which are the same number
 * written for someone dialling from abroad.
 */
export function toDomesticDigits(raw: string): string {
  const halfWidth = raw.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  let digits = halfWidth.replace(/[^0-9]/g, '');

  // +81 90… and 0081 90… both mean 090…: strip the country code, restore the
  // trunk '0' the international form drops.
  if (/^\+|^００|^00/.test(halfWidth.trim()) && digits.startsWith('0081')) {
    digits = `0${digits.slice(4)}`;
  } else if (halfWidth.trim().startsWith('+') && digits.startsWith('81')) {
    digits = `0${digits.slice(2)}`;
  }

  return digits.slice(0, MOBILE_DIGITS);
}

/**
 * `09012345678` → `090-1234-5678`. Formats partial input as it is typed.
 *
 * Tolerates a non-string because its input comes off a Firestore document,
 * where `docSnap.data() as UserProfile` is a cast rather than validation. A
 * number there used to throw and take the whole app down to a white screen —
 * and it did not need a corrupt document to happen: Firestore applies a write
 * to the local cache before the server rules reject it, so one bad write
 * rendered through this function during the round trip.
 */
export function formatMobileNumber(value: unknown): string {
  // Keeping only digits means unexpected values render as nothing rather than
  // as "[ob-ject- Object]". Callers pass an already-digits-only string, so
  // this is a no-op on the normal path.
  const digits = (value == null ? '' : String(value)).replace(/[^0-9]/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

/**
 * Why this number cannot be saved, or null when it can.
 *
 * Returns the message rather than a boolean because "invalid" alone gives the
 * user nothing to act on — wrong length and wrong prefix need different fixes.
 */
export function validateMobileNumber(digits: string): string | null {
  if (!digits) return '携帯電話番号を入力してください。';
  if (!MOBILE_PREFIXES.some((prefix) => digits.startsWith(prefix))) {
    return `携帯電話番号は${MOBILE_PREFIXES.join('・')}から始まる番号をご入力ください。`;
  }
  if (digits.length !== MOBILE_DIGITS) {
    return `携帯電話番号は${MOBILE_DIGITS}桁です。（現在${digits.length}桁）`;
  }
  return null;
}
