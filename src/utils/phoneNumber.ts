// Normalizes phone numbers as saved on business cards into the digits-only
// E.164 form iOS's CXCallDirectoryPhoneNumber requires — country code, no
// leading '+', no spaces/dashes/parens. Business cards are Japan-first in
// this app, so a bare leading '0' is assumed domestic (+81) unless the number
// already carries a country code.
//
// This intentionally returns null far more often than it guesses: an
// ambiguous or too-short number silently corrupts the caller ID directory
// (iOS aborts the entire load on one malformed entry), so a number this
// cannot normalize with confidence is dropped rather than passed through.

const JAPAN_COUNTRY_CODE = '81';

// Every domestic Japanese number reaches 10 or 11 digits including the trunk
// '0': landline and 0120/0570 are 10, mobile (070/080/090), 050 IP and 0800
// are 11. Anything outside that is not a number that can ring — usually a
// card annotation the digit strip swallowed ("070-5567-4628 (内線123)") or a
// mistyped entry — and registering it would put a number nobody can call into
// the directory.
const JP_DOMESTIC_MIN = 10;
const JP_DOMESTIC_MAX = 11;

export function normalizePhoneNumber(raw: string | undefined | null): string | null {
  if (!raw) return null;

  const trimmed = raw.trim();
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.length < 8) return null; // too short to be a real line

  // '+81…' and Japan's international access prefix '0081…' mean the same
  // thing. Without the second case the leading '0' looks domestic and the
  // trunk-prefix strip below turns it into 81|0081… — a number that dials
  // nowhere, quietly registered as if it were the person's line.
  const international = trimmed.startsWith('+')
    ? digits
    : digits.startsWith('00') ? digits.slice(2) : null;

  if (international !== null) {
    // Already carries an explicit country code.
    return international.length >= 8 && international.length <= 15 ? international : null;
  }

  if (digits.startsWith('0')) {
    // Domestic Japanese format, e.g. 03-1234-5678 or 090-1234-5678.
    if (digits.length < JP_DOMESTIC_MIN || digits.length > JP_DOMESTIC_MAX) return null;
    return JAPAN_COUNTRY_CODE + digits.slice(1);
  }

  if (digits.startsWith(JAPAN_COUNTRY_CODE) && digits.length >= 11) {
    // Already 81... without the leading '+' (e.g. copy-pasted from a filled form).
    return digits.length <= 15 ? digits : null;
  }

  // Anything else is too ambiguous to guess a country code for.
  return null;
}
