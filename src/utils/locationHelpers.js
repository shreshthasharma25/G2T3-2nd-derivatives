import { LOCALITY_COORDINATES, calculateDistanceKm } from './problemClustering';

/**
 * Standard known Kolkata locality names supported downstream by clustering and scoring.
 */
export const KNOWN_LOCALITIES = [
  'Salt Lake',
  'New Town',
  'Park Street',
  'Ballygunge',
  'Garia',
  'Behala',
  'Dum Dum',
  'Howrah'
];

export const KOLKATA_AREAS = [
  ...KNOWN_LOCALITIES,
  'Other'
];

/**
 * Bounds roughly enclosing Kolkata Metropolitan Area (lat: 22.35 - 22.75, lng: 88.15 - 88.60).
 */
export const KOLKATA_BOUNDS = {
  minLat: 22.35,
  maxLat: 22.75,
  minLng: 88.15,
  maxLng: 88.60
};

/**
 * Checks whether given coordinates fall outside Kolkata metropolitan area.
 */
export function isOutsideKolkata(lat, lng) {
  if (lat == null || lng == null) return false;
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (Number.isNaN(numLat) || Number.isNaN(numLng)) return false;

  return (
    numLat < KOLKATA_BOUNDS.minLat ||
    numLat > KOLKATA_BOUNDS.maxLat ||
    numLng < KOLKATA_BOUNDS.minLng ||
    numLng > KOLKATA_BOUNDS.maxLng
  );
}

/**
 * Validates a 6-digit Indian PIN code.
 */
export function isValidPinCode(pin) {
  if (!pin) return false;
  return /^[1-9][0-9]{5}$/.test(String(pin).trim());
}

/**
 * Strips non-digit characters and caps length to 6 digits.
 */
export function sanitizePinCode(pin) {
  return String(pin || '').replace(/\D/g, '').slice(0, 6);
}

/**
 * Snaps reverse-geocoded address candidate text or coordinates to one of Kolkata's
 * supported localities ("Park Street", "Salt Lake", "New Town", "Howrah", "Ballygunge",
 * "Garia", "Behala", "Dum Dum", or "Other").
 *
 * Priority:
 * 1. Substring / case-insensitive match against candidate text (suburb, neighbourhood, etc.)
 * 2. Nearest entry in LOCALITY_COORDINATES within ~6 km
 * 3. Fallback to "Other"
 */
export function snapToKolkataLocality(candidates, lat, lng) {
  // 1. Text-based matching
  const textItems = (Array.isArray(candidates) ? candidates : [candidates]).filter(Boolean);
  for (const item of textItems) {
    const cleanItem = String(item).toLowerCase();
    const compactItem = cleanItem.replace(/[\s\-_]+/g, '');

    for (const known of KNOWN_LOCALITIES) {
      const cleanKnown = known.toLowerCase();
      const compactKnown = cleanKnown.replace(/[\s\-_]+/g, '');

      // Check substring in both normal and space-stripped forms
      if (cleanItem.includes(cleanKnown) || compactItem.includes(compactKnown)) {
        return known;
      }

      // Check if known name is contained in item if item has enough characters
      if (cleanItem.length >= 4 && cleanKnown.includes(cleanItem)) {
        return known;
      }
    }
  }

  // 2. Coordinate proximity check within ~6 km
  if (lat != null && lng != null) {
    const numLat = Number(lat);
    const numLng = Number(lng);
    if (!Number.isNaN(numLat) && !Number.isNaN(numLng)) {
      let nearestLocality = null;
      let minDistance = Infinity;

      for (const known of KNOWN_LOCALITIES) {
        const coords = LOCALITY_COORDINATES[known];
        if (coords) {
          const dist = calculateDistanceKm([numLat, numLng], coords);
          if (dist < minDistance) {
            minDistance = dist;
            nearestLocality = known;
          }
        }
      }

      if (nearestLocality && minDistance <= 6.0) {
        return nearestLocality;
      }
    }
  }

  return 'Other';
}

/**
 * Formats a clean, readable full address from formData:
 * "{houseNo} {street}, {landmark ? 'Near ' + landmark : ''}, {location}, {city}, {state} - {pinCode}"
 * cleanly skipping missing / empty fields.
 */
export function formatFullAddress(formData) {
  if (!formData) return '';

  const parts = [];

  // House number + Street
  const streetPart = [formData.houseNo?.trim(), formData.street?.trim()]
    .filter(Boolean)
    .join(' ');
  if (streetPart) parts.push(streetPart);

  // Landmark
  if (formData.landmark?.trim()) {
    parts.push(`Near ${formData.landmark.trim()}`);
  }

  // Locality / Area
  if (formData.location?.trim()) {
    parts.push(formData.location.trim());
  }

  // City
  if (formData.city?.trim()) {
    parts.push(formData.city.trim());
  }

  let formatted = parts.join(', ');

  // State
  if (formData.state?.trim()) {
    formatted = formatted ? `${formatted}, ${formData.state.trim()}` : formData.state.trim();
  }

  // PIN code
  if (formData.pinCode?.trim()) {
    formatted = formatted ? `${formatted} - ${formData.pinCode.trim()}` : formData.pinCode.trim();
  }

  return formatted;
}
