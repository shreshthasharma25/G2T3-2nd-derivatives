import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Search,
  Navigation,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Info,
  AlertCircle
} from 'lucide-react';
import {
  KOLKATA_AREAS,
  isOutsideKolkata,
  isValidPinCode,
  sanitizePinCode
} from '../../utils/locationHelpers';
import {
  reverseGeocode,
  searchAddress,
  lookupPinCode
} from '../../services/geocodingService';

// Default Kolkata center coordinates
const DEFAULT_CENTER = [22.5726, 88.3639];
const DEFAULT_ZOOM = 12;

// Custom pin marker icon to avoid Vite/Leaflet broken asset issues
const createCustomPinIcon = () => {
  return L.divIcon({
    className: '!bg-transparent !border-0',
    html: `
      <div style="position: relative; width: 34px; height: 44px; transform: translate(-50%, -100%); cursor: grab;">
        <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.35));">
          <path d="M17 0C7.61116 0 0 7.61116 0 17C0 29.5 17 44 17 44C17 44 34 29.5 34 17C34 7.61116 26.3888 0 17 0Z" fill="#1D4ED8"/>
          <circle cx="17" cy="16" r="6.5" fill="#FFFFFF"/>
          <circle cx="17" cy="16" r="3" fill="#1D4ED8"/>
        </svg>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
};

/**
 * Helper to update map view and invalidate size when step is mounted
 */
function MapController({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    // Invalidate size shortly after mount in case container size shifted
    map.invalidateSize();
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (center && center[0] != null && center[1] != null) {
      map.setView(center, zoom || 17, { animate: true });
    }
  }, [center, zoom, map]);

  return null;
}

/**
 * Listens to map clicks to reposition the pin
 */
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
}

const LocationPicker = ({ formData, setFormData }) => {
  // Pin marker icon
  const pinIcon = useMemo(() => createCustomPinIcon(), []);

  // Map state
  const hasCoordinates = formData.latitude != null && formData.longitude != null;
  const [mapCenter, setMapCenter] = useState(
    hasCoordinates ? [formData.latitude, formData.longitude] : DEFAULT_CENTER
  );
  const [mapZoom, setMapZoom] = useState(hasCoordinates ? 17 : DEFAULT_ZOOM);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState(-1);
  const searchContainerRef = useRef(null);

  // Status & error state
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState(null);
  const [lastGeocoded, setLastGeocoded] = useState(null);

  // Track which fields the user has manually edited so pin moves do not clobber them
  const [touchedFields, setTouchedFields] = useState(new Set());

  // Refs for cleanup
  const watchIdRef = useRef(null);
  const watchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const searchDebounceRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (watchTimeoutRef.current != null) {
        clearTimeout(watchTimeoutRef.current);
      }
      if (abortControllerRef.current != null) {
        abortControllerRef.current.abort();
      }
      if (searchDebounceRef.current != null) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  // Close search suggestions on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Helper to mark a field as touched by user manual edit
  const markFieldTouched = (fieldName) => {
    setTouchedFields(prev => {
      if (prev.has(fieldName)) return prev;
      const next = new Set(prev);
      next.add(fieldName);
      return next;
    });
  };

  /**
   * Unified location selection handler (from GPS, map click, drag, or search)
   */
  const handleLocationSelect = useCallback(async (lat, lng, source, presetAddress = null) => {
    // Abort any ongoing reverse-geocode
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setMapCenter([lat, lng]);
    setMapZoom(17);
    setIsGeocoding(true);
    setGeocodeError(null);

    // Update coordinates immediately
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      coordinates: [lat, lng],
      locationSource: source,
      locationAccuracy: source === 'gps' ? prev.locationAccuracy : null
    }));

    // Trigger reverse geocode
    const geocoded = await reverseGeocode(lat, lng, controller.signal);

    if (controller.signal.aborted) return;

    setIsGeocoding(false);

    if (geocoded) {
      setLastGeocoded(geocoded);
      setFormData(prev => {
        const updates = {};
        if (!touchedFields.has('houseNo') && geocoded.houseNo) {
          updates.houseNo = geocoded.houseNo;
        }
        if (!touchedFields.has('street') && geocoded.street) {
          updates.street = geocoded.street;
        }
        if (!touchedFields.has('location') && geocoded.locality) {
          updates.location = geocoded.locality;
        }
        if (!touchedFields.has('city') && geocoded.city) {
          updates.city = geocoded.city;
        }
        if (!touchedFields.has('state') && geocoded.state) {
          updates.state = geocoded.state;
        }
        if (!touchedFields.has('pinCode') && geocoded.pinCode) {
          updates.pinCode = geocoded.pinCode;
        }
        return { ...prev, ...updates };
      });
    } else if (presetAddress) {
      setLastGeocoded({ ...presetAddress, latitude: lat, longitude: lng });
      setFormData(prev => {
        const updates = {};
        if (!touchedFields.has('houseNo') && presetAddress.houseNo) updates.houseNo = presetAddress.houseNo;
        if (!touchedFields.has('street') && presetAddress.street) updates.street = presetAddress.street;
        if (!touchedFields.has('location') && presetAddress.locality) updates.location = presetAddress.locality;
        if (!touchedFields.has('city') && presetAddress.city) updates.city = presetAddress.city;
        if (!touchedFields.has('state') && presetAddress.state) updates.state = presetAddress.state;
        if (!touchedFields.has('pinCode') && presetAddress.pinCode) updates.pinCode = presetAddress.pinCode;
        return { ...prev, ...updates };
      });
    } else {
      setGeocodeError("Couldn't fetch the address automatically, please type it below.");
    }
  }, [touchedFields, setFormData]);

  /**
   * Browser Geolocation (Live Location)
   */
  const handleGetCurrentLocation = () => {
    if (isLocating) return;
    setGeoError(null);

    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }

    if (
      typeof window !== 'undefined' &&
      window.isSecureContext === false &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      setGeoError("Geolocation requires a secure connection (HTTPS). Please search or enter your address manually.");
      return;
    }

    setIsLocating(true);

    let bestAccuracy = Infinity;
    let bestPosition = null;

    const handlePos = (position) => {
      const accuracy = position.coords.accuracy;
      if (accuracy < bestAccuracy) {
        bestAccuracy = accuracy;
        bestPosition = position;

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setFormData(prev => ({
          ...prev,
          locationAccuracy: Math.round(accuracy)
        }));

        handleLocationSelect(lat, lng, 'gps');
      }
    };

    const handleErr = (err) => {
      if (bestPosition) return;

      let msg = "Could not retrieve your location. Please search or enter your address manually.";
      if (err.code === 1) {
        msg = "Location access was denied. Please search for your area or enter the address manually.";
      } else if (err.code === 2) {
        msg = "Location information is unavailable. Please search or enter your address manually.";
      } else if (err.code === 3) {
        msg = "Location request timed out. Please try again or enter your address manually.";
      }
      setGeoError(msg);
      setIsLocating(false);

      if (watchIdRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (watchTimeoutRef.current != null) {
        clearTimeout(watchTimeoutRef.current);
        watchTimeoutRef.current = null;
      }
    };

    // Initial fix
    navigator.geolocation.getCurrentPosition(handlePos, handleErr, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    });

    // Refinement via watchPosition up to ~8 seconds
    try {
      const id = navigator.geolocation.watchPosition(handlePos, () => {}, {
        enableHighAccuracy: true,
        maximumAge: 0
      });
      watchIdRef.current = id;
    } catch {
      // Ignore watch setup error
    }

    watchTimeoutRef.current = setTimeout(() => {
      if (watchIdRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsLocating(false);
    }, 8000);
  };

  /**
   * Search input handler with 500ms debounce
   */
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setSelectedSuggestionIdx(-1);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (query.trim().length < 3) {
      setSuggestions([]);
      setIsSearching(false);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    setShowSuggestions(true);

    searchDebounceRef.current = setTimeout(async () => {
      const results = await searchAddress(query);
      setSuggestions(results);
      setIsSearching(false);
      setShowSuggestions(true);
    }, 500);
  };

  const handleSelectSuggestion = (suggestion) => {
    setSearchQuery(suggestion.primaryName || suggestion.label);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedSuggestionIdx(-1);
    handleLocationSelect(suggestion.lat, suggestion.lng, 'search', suggestion.address);
  };

  const handleSearchKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') e.preventDefault();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIdx(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIdx(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIdx >= 0 && suggestions[selectedSuggestionIdx]) {
        handleSelectSuggestion(suggestions[selectedSuggestionIdx]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  /**
   * Form inputs
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    markFieldTouched(name);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePinCodeChange = async (e) => {
    const sanitized = sanitizePinCode(e.target.value);
    markFieldTouched('pinCode');

    setFormData(prev => ({ ...prev, pinCode: sanitized }));

    // When valid 6-digit PIN entered and city / state are untouched, prefill from postal lookup
    if (isValidPinCode(sanitized)) {
      if (!touchedFields.has('city') || !touchedFields.has('state')) {
        const pinData = await lookupPinCode(sanitized);
        if (pinData) {
          setFormData(prev => ({
            ...prev,
            city: !touchedFields.has('city') && pinData.city ? pinData.city : prev.city,
            state: !touchedFields.has('state') && pinData.state ? pinData.state : prev.state
          }));
        }
      }
    }
  };

  /**
   * Force refill all fields from current map pin
   */
  const handleRefillFromPin = () => {
    if (!lastGeocoded) return;
    setTouchedFields(new Set());
    setFormData(prev => ({
      ...prev,
      houseNo: lastGeocoded.houseNo || '',
      street: lastGeocoded.street || '',
      location: lastGeocoded.locality || prev.location,
      city: lastGeocoded.city || 'Kolkata',
      state: lastGeocoded.state || 'West Bengal',
      pinCode: lastGeocoded.pinCode || prev.pinCode
    }));
  };

  // Warnings
  const pinIsOutsideKolkata = hasCoordinates && isOutsideKolkata(formData.latitude, formData.longitude);
  const isApproximateGps =
    formData.locationSource === 'gps' &&
    formData.locationAccuracy != null &&
    formData.locationAccuracy > 100;

  return (
    <div className="space-y-6">
      {/* Top Bar: Search and Live Location */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
        {/* Search Box */}
        <div ref={searchContainerRef} className="flex-1 relative">
          <label htmlFor="location-search" className="block text-sm font-semibold text-gray-700 mb-1">
            Search street, landmark or area
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              id="location-search"
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              placeholder="e.g. Park Street metro, Salt Lake Sector V, Howrah..."
              autoComplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={showSuggestions && suggestions.length > 0}
              aria-controls="location-suggestions-list"
              className="block w-full rounded-md border border-gray-300 pl-10 pr-10 py-2.5 text-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              </div>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <ul
              id="location-suggestions-list"
              role="listbox"
              className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto divide-y divide-gray-100"
            >
              {suggestions.map((suggestion, idx) => (
                <li
                  key={suggestion.id || idx}
                  role="option"
                  aria-selected={idx === selectedSuggestionIdx}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className={`px-4 py-2.5 cursor-pointer text-sm flex items-start gap-2.5 transition-colors ${
                    idx === selectedSuggestionIdx ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">
                      {suggestion.primaryName || suggestion.label}
                    </p>
                    {suggestion.secondaryText && (
                      <p className="text-xs text-gray-500 truncate">
                        {suggestion.secondaryText}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Live Location Button */}
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap h-[42px] shadow-sm"
        >
          {isLocating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-blue-700" />
              <span>Detecting location...</span>
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4 text-blue-700" />
              <span>Use my current location</span>
            </>
          )}
        </button>
      </div>

      {/* Geolocation Feedback / Inline Error */}
      {geoError && (
        <div
          className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start text-red-800 text-xs"
          role="status"
          aria-live="polite"
        >
          <AlertCircle className="h-4 w-4 text-red-600 mr-2 shrink-0 mt-0.5" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Approximate GPS Warning */}
      {isApproximateGps && (
        <div
          className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center text-blue-800 text-xs"
          role="status"
          aria-live="polite"
        >
          <Info className="h-4 w-4 text-blue-600 mr-2 shrink-0" />
          <span>
            Location is approximate (accuracy ±{formData.locationAccuracy} m). Please drag the pin to the exact spot.
          </span>
        </div>
      )}

      {/* Outside Kolkata Soft Warning */}
      {pinIsOutsideKolkata && (
        <div
          className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center text-amber-800 text-xs"
          role="status"
          aria-live="polite"
        >
          <AlertTriangle className="h-4 w-4 text-amber-600 mr-2 shrink-0" />
          <span>This point looks outside Kolkata.</span>
        </div>
      )}

      {/* Interactive Map */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Interactive Pin (Tap or drag to adjust)
          </span>
          {isGeocoding && (
            <span className="text-xs text-blue-600 flex items-center gap-1 font-medium">
              <Loader2 className="w-3 h-3 animate-spin" />
              Fetching address...
            </span>
          )}
          {lastGeocoded && touchedFields.size > 0 && (
            <button
              type="button"
              onClick={handleRefillFromPin}
              className="text-xs text-blue-700 hover:text-blue-800 font-medium inline-flex items-center gap-1 underline underline-offset-2"
            >
              <RotateCcw className="w-3 h-3" />
              Refill from map pin
            </button>
          )}
        </div>

        <div className="h-[260px] sm:h-[320px] w-full rounded-lg overflow-hidden border border-gray-300 relative z-0 shadow-inner">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapController center={mapCenter} zoom={mapZoom} />
            <MapClickHandler onMapClick={(lat, lng) => handleLocationSelect(lat, lng, 'map')} />

            {/* Draggable Marker Pin */}
            {hasCoordinates && (
              <Marker
                position={[formData.latitude, formData.longitude]}
                draggable={true}
                icon={pinIcon}
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target;
                    const pos = marker.getLatLng();
                    handleLocationSelect(pos.lat, pos.lng, 'map');
                  }
                }}
              />
            )}

            {/* GPS Accuracy Circle */}
            {hasCoordinates &&
              formData.locationSource === 'gps' &&
              formData.locationAccuracy != null && (
                <Circle
                  center={[formData.latitude, formData.longitude]}
                  radius={formData.locationAccuracy}
                  pathOptions={{
                    color: '#2563eb',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.15,
                    weight: 1.5
                  }}
                />
              )}
          </MapContainer>
        </div>

        {!hasCoordinates && (
          <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-gray-400" />
            Click on the map or use the search box / location button above to set the pin.
          </p>
        )}
      </div>

      {/* Reverse Geocode Network Failure Notice */}
      {geocodeError && (
        <div
          className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center text-gray-700 text-xs"
          role="status"
          aria-live="polite"
        >
          <Info className="h-4 w-4 text-gray-500 mr-2 shrink-0" />
          <span>{geocodeError}</span>
        </div>
      )}

      {/* Editable Address Form Fields */}
      <div className="pt-2 border-t border-gray-100 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
          Address Details
        </h3>

        {/* House / Street No. & Street / Road name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="houseNo" className="block text-sm font-semibold text-gray-700 mb-1">
              House / Street No.
            </label>
            <input
              type="text"
              id="houseNo"
              name="houseNo"
              value={formData.houseNo || ''}
              onChange={handleInputChange}
              placeholder="e.g. Flat 4B, Building 12"
              className="block w-full rounded-md border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white"
            />
            <p className="text-xs text-gray-500 mt-1">Flat, house or building number</p>
          </div>

          <div>
            <label htmlFor="street" className="block text-sm font-semibold text-gray-700 mb-1">
              Street / Road name
            </label>
            <input
              type="text"
              id="street"
              name="street"
              value={formData.street || ''}
              onChange={handleInputChange}
              placeholder="e.g. Park Street, Bidhan Sarani"
              className="block w-full rounded-md border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white"
            />
          </div>
        </div>

        {/* Locality / Area & Landmark */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-1">
              Locality / Area *
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <select
                name="location"
                id="location"
                required
                value={formData.location || ''}
                onChange={handleInputChange}
                className="block w-full rounded-md border border-gray-300 pl-10 px-4 py-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white"
              >
                <option value="">Select an area in Kolkata</option>
                {KOLKATA_AREAS.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="landmark" className="block text-sm font-semibold text-gray-700 mb-1">
              Landmark (Optional)
            </label>
            <input
              type="text"
              id="landmark"
              name="landmark"
              value={formData.landmark || ''}
              onChange={handleInputChange}
              placeholder="e.g. opposite City Centre metro gate 2"
              className="block w-full rounded-md border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white"
            />
            <p className="text-xs text-gray-500 mt-1">e.g. opposite City Centre metro gate 2</p>
          </div>
        </div>

        {/* City, State & PIN code */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-1">
              City *
            </label>
            <input
              type="text"
              name="city"
              id="city"
              required
              value={formData.city || ''}
              onChange={handleInputChange}
              className="block w-full rounded-md border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white"
            />
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-1">
              State / Region *
            </label>
            <input
              type="text"
              name="state"
              id="state"
              required
              value={formData.state || ''}
              onChange={handleInputChange}
              className="block w-full rounded-md border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white"
            />
          </div>

          <div>
            <label htmlFor="pinCode" className="block text-sm font-semibold text-gray-700 mb-1">
              PIN code *
            </label>
            <input
              type="text"
              name="pinCode"
              id="pinCode"
              required
              inputMode="numeric"
              maxLength={6}
              value={formData.pinCode || ''}
              onChange={handlePinCodeChange}
              placeholder="e.g. 700016"
              className={`block w-full rounded-md border px-4 py-3 sm:text-sm bg-white focus:ring-blue-500 ${
                formData.pinCode && !isValidPinCode(formData.pinCode)
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-gray-300 focus:border-blue-500'
              }`}
            />
            {formData.pinCode && !isValidPinCode(formData.pinCode) && (
              <p className="text-xs text-red-600 mt-1" role="alert">
                Please enter a valid 6-digit Indian PIN code.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
