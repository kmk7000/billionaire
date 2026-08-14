// Turns the addresses captured from business cards into map coordinates.
// Uses the Geocoder from the already-loaded Maps JS SDK, so it needs the
// "Geocoding API" enabled on the same Google Cloud project as the map.

export interface Coordinates {
  lat: number;
  lng: number;
}

/** Geocoding is billed per request, so never ask twice for the same string. */
const cache = new Map<string, Coordinates | null>();

export function buildGeocodeQuery(address?: string, detailedAddress?: string): string {
  const base = (address || '').trim();
  const detail = (detailedAddress || '').trim();
  // OCR frequently writes the same text into both fields; sending it twice
  // only confuses the geocoder.
  if (!detail || base.includes(detail)) return base;
  if (!base) return detail;
  return `${base} ${detail}`;
}

/**
 * Resolve a single address. Returns null when the address is unusable or the
 * geocoder has nothing for it — callers should treat that as "not mappable"
 * rather than retrying.
 */
export function geocodeAddress(address: string): Promise<Coordinates | null> {
  const query = address.trim();
  if (!query) return Promise.resolve(null);
  if (cache.has(query)) return Promise.resolve(cache.get(query)!);

  if (typeof google === 'undefined' || !google.maps?.Geocoder) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: query, region: 'jp' }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
        const location = results[0].geometry.location;
        const coords = { lat: location.lat(), lng: location.lng() };
        cache.set(query, coords);
        resolve(coords);
        return;
      }

      if (status === google.maps.GeocoderStatus.REQUEST_DENIED) {
        // Almost always "Geocoding API not enabled" — worth surfacing loudly
        // once rather than silently dropping every pin.
        console.error(
          'Geocoding request denied. Enable the "Geocoding API" in Google Cloud Console.'
        );
        // Not cached: the user may enable the API and retry without a reload.
        resolve(null);
        return;
      }

      if (status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
        console.warn('Geocoding rate limit hit; will retry later.');
        resolve(null);
        return;
      }

      // ZERO_RESULTS and friends: the address genuinely can't be placed.
      cache.set(query, null);
      resolve(null);
    });
  });
}

/**
 * Geocode a batch one at a time. Google rate-limits bursts, so requests are
 * spaced out; `onResolved` fires per address to let the UI fill in pins
 * progressively instead of waiting for the whole batch.
 */
export async function geocodeSequentially<T>(
  items: T[],
  getQuery: (item: T) => string,
  onResolved: (item: T, coords: Coordinates) => void,
  delayMs = 120
): Promise<{ resolved: number; failed: number }> {
  let resolved = 0;
  let failed = 0;

  for (const item of items) {
    const coords = await geocodeAddress(getQuery(item));
    if (coords) {
      resolved += 1;
      onResolved(item, coords);
    } else {
      failed += 1;
    }
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
  }

  return { resolved, failed };
}
