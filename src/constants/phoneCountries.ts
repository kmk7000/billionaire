// Countries a business card's phone numbers can belong to.
//
// The app is Japan-first, so JP is the default and stays the default for every
// card saved before this existed. The list is deliberately short: it covers
// where this app's users actually exchange cards rather than trying to be a
// complete ITU table, because each entry has to be *correct* — a wrong trunk
// rule silently produces a number that dials nowhere.
//
// `trunkPrefix` is the digit written in front of a domestic number that is
// dropped when dialling internationally. Most countries use '0'; the NANP
// (+1) and the city-states have none, and their numbers are written at full
// length already. Getting this wrong in either direction corrupts the number,
// which is why it is data here rather than an assumption in the parser.

export interface PhoneCountry {
  /** ISO 3166-1 alpha-2, stored on the card. */
  code: string;
  /** Country calling code, no '+'. */
  dialCode: string;
  /** Domestic trunk prefix to strip, or null where there is none. */
  trunkPrefix: string | null;
  /** Valid length range of the national significant number (after the trunk
      prefix is removed). Used to reject a number that cannot be dialled. */
  nsnMin: number;
  nsnMax: number;
  /** Shown in the picker. */
  label: string;
  /** Placeholder in the number fields. */
  example: string;
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: 'JP', dialCode: '81', trunkPrefix: '0', nsnMin: 9, nsnMax: 10, label: '日本 (+81)', example: '090-1234-5678' },
  { code: 'KR', dialCode: '82', trunkPrefix: '0', nsnMin: 9, nsnMax: 10, label: '韓国 (+82)', example: '010-1234-5678' },
  { code: 'US', dialCode: '1', trunkPrefix: null, nsnMin: 10, nsnMax: 10, label: 'アメリカ (+1)', example: '415-555-2671' },
  { code: 'CN', dialCode: '86', trunkPrefix: '0', nsnMin: 9, nsnMax: 11, label: '中国 (+86)', example: '131-2345-6789' },
  { code: 'TW', dialCode: '886', trunkPrefix: '0', nsnMin: 8, nsnMax: 9, label: '台湾 (+886)', example: '0912-345-678' },
  { code: 'HK', dialCode: '852', trunkPrefix: null, nsnMin: 8, nsnMax: 8, label: '香港 (+852)', example: '5123 4567' },
  { code: 'SG', dialCode: '65', trunkPrefix: null, nsnMin: 8, nsnMax: 8, label: 'シンガポール (+65)', example: '8123 4567' },
  { code: 'TH', dialCode: '66', trunkPrefix: '0', nsnMin: 8, nsnMax: 9, label: 'タイ (+66)', example: '081-234-5678' },
  { code: 'VN', dialCode: '84', trunkPrefix: '0', nsnMin: 9, nsnMax: 9, label: 'ベトナム (+84)', example: '091-234-5678' },
  { code: 'ID', dialCode: '62', trunkPrefix: '0', nsnMin: 9, nsnMax: 11, label: 'インドネシア (+62)', example: '0812-3456-7890' },
  { code: 'IN', dialCode: '91', trunkPrefix: '0', nsnMin: 10, nsnMax: 10, label: 'インド (+91)', example: '98765-43210' },
  { code: 'GB', dialCode: '44', trunkPrefix: '0', nsnMin: 9, nsnMax: 10, label: 'イギリス (+44)', example: '07400 123456' },
  { code: 'DE', dialCode: '49', trunkPrefix: '0', nsnMin: 9, nsnMax: 11, label: 'ドイツ (+49)', example: '0151 23456789' },
  { code: 'FR', dialCode: '33', trunkPrefix: '0', nsnMin: 9, nsnMax: 9, label: 'フランス (+33)', example: '06 12 34 56 78' },
  { code: 'AU', dialCode: '61', trunkPrefix: '0', nsnMin: 9, nsnMax: 9, label: 'オーストラリア (+61)', example: '0412 345 678' },
];

/** Cards saved before the picker existed carry no country — they are Japanese. */
export const DEFAULT_PHONE_COUNTRY = 'JP';

export function getPhoneCountry(code: string | undefined | null): PhoneCountry {
  return PHONE_COUNTRIES.find((c) => c.code === code)
    ?? PHONE_COUNTRIES.find((c) => c.code === DEFAULT_PHONE_COUNTRY)!;
}
