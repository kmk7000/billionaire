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

export function normalizePhoneNumber(raw: string | undefined | null): string | null {
  if (!raw) return null;

  const hasPlus = raw.trim().startsWith('+');
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.length < 8) return null; // too short to be a real line

  if (hasPlus) {
    // Already carries an explicit country code.
    return digits.length <= 15 ? digits : null;
  }

  if (digits.startsWith('0')) {
    // Domestic Japanese format, e.g. 03-1234-5678 or 090-1234-5678.
    return JAPAN_COUNTRY_CODE + digits.slice(1);
  }

  if (digits.startsWith(JAPAN_COUNTRY_CODE) && digits.length >= 11) {
    // Already 81... without the leading '+' (e.g. copy-pasted from a filled form).
    return digits;
  }

  // Anything else is too ambiguous to guess a country code for.
  return null;
}
