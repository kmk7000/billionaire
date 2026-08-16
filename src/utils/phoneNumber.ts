// Normalizes phone numbers as saved on business cards into the digits-only
// E.164 form iOS's CXCallDirectoryPhoneNumber requires — country code, no
// leading '+', no spaces/dashes/parens.
//
// The country comes from the card (see src/constants/phoneCountries.ts), not
// from an assumption. It used to be hardcoded to Japan, which meant a Korean
// card's 010-7105-9914 was read as a Japanese number and registered as
// +81 10 7105 9914 — a number that reaches nobody, indistinguishable from
// success because nothing errors.
//
// This intentionally returns null far more often than it guesses: an
// ambiguous or out-of-range number silently corrupts the caller ID directory
// (iOS aborts the entire load on one malformed entry), so a number this
// cannot normalize with confidence is dropped rather than passed through.

import { DEFAULT_PHONE_COUNTRY, getPhoneCountry } from '../constants/phoneCountries';

export function normalizePhoneNumber(
  raw: string | undefined | null,
  countryCode: string = DEFAULT_PHONE_COUNTRY,
): string | null {
  if (!raw) return null;

  const country = getPhoneCountry(countryCode);
  const trimmed = raw.trim();
  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits) return null;

  // '+81…' and the international access prefix '0081…' say the same thing,
  // and both already carry a country code — the card's country does not
  // override what the number itself states.
  const international = trimmed.startsWith('+')
    ? digits
    : digits.startsWith('00') ? digits.slice(2) : null;

  if (international !== null) {
    return international.length >= 8 && international.length <= 15 ? international : null;
  }

  // Domestic form. Strip the trunk prefix where the country uses one; where it
  // does not (NANP, Hong Kong, Singapore), the number is already the national
  // significant number and stripping a leading digit would mangle it.
  let nsn = digits;
  if (country.trunkPrefix) {
    if (nsn.startsWith(country.trunkPrefix)) {
      nsn = nsn.slice(country.trunkPrefix.length);
    } else if (nsn.startsWith(country.dialCode) && nsn.length > country.nsnMax) {
      // Already written with the country code but no '+' (e.g. pasted from a
      // filled form). Accept it as-is below.
      return nsn.length <= 15 ? nsn : null;
    }
  } else if (nsn.startsWith(country.dialCode) && nsn.length > country.nsnMax) {
    return nsn.length <= 15 ? nsn : null;
  }

  // Out of range means this is not a dialable number for that country — an
  // extension the digit strip swallowed ("090-1234-5678 (内線123)"), a
  // truncated entry, or free text. Registering it would put a number nobody
  // can call into the directory.
  if (nsn.length < country.nsnMin || nsn.length > country.nsnMax) return null;

  return country.dialCode + nsn;
}
