import { snapToKolkataLocality } from '../utils/locationHelpers';

/**
 * Geocoding Service
 *
 * Provides geocoding, reverse geocoding, and postal PIN lookup.
 *
 * NOTE: Uses public OpenStreetMap (Nominatim), Photon (Komoot), and postalpincode.in APIs
 * for prototype demonstration.
 * In a production deployment, this service should swap in a keyed provider with guaranteed SLA
 * and commercial terms, such as Mappls (MapmyIndia), Google Places / Geocoding API, or Mapbox.
 */

// In-memory cache for search results to avoid redundant network queries
const searchCache = new Map();

// Throttling for Nominatim usage policy (maximum 1 request per second)
let lastNominatimTimestamp = 0;

async function throttleNominatim() {
  const now = Date.now();
  const elapsed = now - lastNominatimTimestamp;
  if (elapsed < 1050) {
    await new Promise(resolve => setTimeout(resolve, 1050 - elapsed));
  }
  lastNominatimTimestamp = Date.now();
}

/**
 * Reverse geocodes a latitude and longitude into normalized address fields.
 *
 * @param {number|string} lat - Latitude
 * @param {number|string} lng - Longitude
 * @param {AbortSignal} [signal] - Optional AbortSignal
 * @returns {Promise<Object|null>} Normalized address or null on failure. Never throws.
 */
export async function reverseGeocode(lat, lng, signal) {
  if (lat == null || lng == null) return null;

  try {
    await throttleNominatim();

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=en&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
    
    const response = await fetch(url, {
      signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data || !data.address) {
      return null;
    }

    const addr = data.address;
    const houseNo = addr.house_number || '';
    const street = addr.road || addr.pedestrian || addr.residential || addr.footway || addr.path || '';

    // Locality candidates: suburb / neighbourhood / city_district / quarter
    const localityCandidates = [
      addr.suburb,
      addr.neighbourhood,
      addr.city_district,
      addr.quarter,
      addr.town
    ].filter(Boolean);

    const locality = snapToKolkataLocality(localityCandidates, lat, lng);
    const city = addr.city || addr.town || addr.village || addr.state_district || 'Kolkata';
    const state = addr.state || 'West Bengal';
    const pinCode = (addr.postcode || '').replace(/\s+/g, '');

    return {
      houseNo,
      street,
      locality,
      localityCandidates,
      city,
      state,
      pinCode,
      displayName: data.display_name || '',
      latitude: parseFloat(lat),
      longitude: parseFloat(lng)
    };
  } catch (error) {
    if (error?.name === 'AbortError') {
      // Re-throw or ignore abort
      return null;
    }
    return null;
  }
}

/**
 * Searches for addresses, streets, or landmarks matching query.
 * Biased/bounded to Kolkata area (lat: 22.35 to 22.75, lng: 88.15 to 88.6).
 *
 * @param {string} query
 * @param {AbortSignal} [signal]
 * @returns {Promise<Array>} Array of max 5 suggestion objects. Never throws.
 */
export async function searchAddress(query, signal) {
  const cleanQuery = String(query || '').trim();
  if (cleanQuery.length < 3) {
    return [];
  }

  const cacheKey = cleanQuery.toLowerCase();
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey);
  }

  // 1. Try Photon (Komoot OSM search API) bounded to Kolkata
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery)}&lat=22.5726&lon=88.3639&bbox=88.15,22.35,88.6,22.75&limit=5`;
    const res = await fetch(photonUrl, { signal });

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.features) && data.features.length > 0) {
        const results = data.features.slice(0, 5).map(f => {
          const p = f.properties || {};
          const coords = f.geometry?.coordinates || [88.3639, 22.5726];
          const lng = coords[0];
          const lat = coords[1];

          const primaryName = p.name || p.street || cleanQuery;
          const secondaryParts = [
            p.street && p.street !== primaryName ? p.street : null,
            p.district,
            p.city || 'Kolkata',
            p.postcode
          ].filter(Boolean);

          const label = secondaryParts.length > 0
            ? `${primaryName}, ${secondaryParts.join(', ')}`
            : primaryName;

          const candidates = [p.district, p.city, p.county].filter(Boolean);
          const locality = snapToKolkataLocality(candidates, lat, lng);

          return {
            id: `photon-${p.osm_type || 'p'}-${p.osm_id || Math.random()}`,
            label,
            primaryName,
            secondaryText: secondaryParts.join(', '),
            lat,
            lng,
            address: {
              houseNo: p.housenumber || '',
              street: p.street || (p.name !== p.city && p.name !== p.district ? p.name : ''),
              locality,
              localityCandidates: candidates,
              city: p.city || 'Kolkata',
              state: p.state || 'West Bengal',
              pinCode: (p.postcode || '').replace(/\s+/g, '')
            }
          };
        });

        searchCache.set(cacheKey, results);
        return results;
      }
    }
  } catch (error) {
    if (error?.name === 'AbortError') return [];
    // Continue to fallback
  }

  // 2. Fallback to Nominatim /search with Kolkata viewbox
  try {
    await throttleNominatim();
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=in&viewbox=88.15,22.75,88.6,22.35&bounded=0&limit=5&q=${encodeURIComponent(cleanQuery)}`;
    
    const res = await fetch(nominatimUrl, {
      signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const results = data.slice(0, 5).map(item => {
          const addr = item.address || {};
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);
          const candidates = [addr.suburb, addr.neighbourhood, addr.city_district, addr.quarter, addr.town].filter(Boolean);
          const locality = snapToKolkataLocality(candidates, lat, lng);

          const primaryName = item.name || addr.road || cleanQuery;
          const secondaryParts = [
            addr.suburb || addr.neighbourhood,
            addr.city || 'Kolkata',
            addr.postcode
          ].filter(Boolean);

          return {
            id: `nominatim-${item.place_id}`,
            label: item.display_name,
            primaryName,
            secondaryText: secondaryParts.join(', '),
            lat,
            lng,
            address: {
              houseNo: addr.house_number || '',
              street: addr.road || addr.pedestrian || addr.residential || '',
              locality,
              localityCandidates: candidates,
              city: addr.city || addr.town || addr.village || addr.state_district || 'Kolkata',
              state: addr.state || 'West Bengal',
              pinCode: (addr.postcode || '').replace(/\s+/g, '')
            }
          };
        });

        searchCache.set(cacheKey, results);
        return results;
      }
    }
  } catch (error) {
    if (error?.name === 'AbortError') return [];
  }

  return [];
}

/**
 * Looks up postal PIN details from postalpincode.in API.
 *
 * @param {string} pin - 6-digit postal code
 * @param {AbortSignal} [signal]
 * @returns {Promise<{city: string, state: string}|null>} City and state, or null on error. Never throws.
 */
export async function lookupPinCode(pin, signal) {
  const cleanPin = String(pin || '').trim();
  if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
    return null;
  }

  try {
    const url = `https://api.postalpincode.in/pincode/${cleanPin}`;
    const response = await fetch(url, { signal });

    if (!response.ok) return null;

    const data = await response.json();
    if (
      Array.isArray(data) &&
      data[0]?.Status === 'Success' &&
      Array.isArray(data[0]?.PostOffice) &&
      data[0].PostOffice.length > 0
    ) {
      const po = data[0].PostOffice[0];
      return {
        city: po.District || po.Division || po.Block || 'Kolkata',
        state: po.State || 'West Bengal'
      };
    }
    return null;
  } catch {
    return null;
  }
}
