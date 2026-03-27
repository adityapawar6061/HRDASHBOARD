import { useEffect, useRef, useState, useCallback } from 'react';

const loadGoogleMaps = () => {
  return new Promise((resolve, reject) => {
    if (window.google?.maps?.places) { resolve(); return; }
    if (document.getElementById('gmap-script')) {
      const check = setInterval(() => {
        if (window.google?.maps?.places) { clearInterval(check); resolve(); }
      }, 150);
      return;
    }
    const script = document.createElement('script');
    script.id = 'gmap-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_KEY}&libraries=places&callback=__gmapInit`;
    script.async = true;
    script.defer = true;
    window.__gmapInit = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const LocationPicker = ({ lat, lng, radius, onChange }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const searchRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState('');
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    loadGoogleMaps()
      .then(() => setMapReady(true))
      .catch(() => setMapError('Failed to load Google Maps. Check your API key.'));
  }, []);

  const placeMarker = useCallback((latVal, lngVal) => {
    if (!mapInstance.current) return;
    const pos = new window.google.maps.LatLng(latVal, lngVal);
    if (markerRef.current) {
      markerRef.current.setPosition(pos);
    } else {
      markerRef.current = new window.google.maps.Marker({
        position: pos,
        map: mapInstance.current,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
        title: 'Campaign Location',
      });
      markerRef.current.addListener('dragend', (e) => {
        const nLat = e.latLng.lat();
        const nLng = e.latLng.lng();
        drawCircle(e.latLng, parseInt(radius) || 200);
        onChange({ lat: nLat.toFixed(6), lng: nLng.toFixed(6) });
      });
    }
    drawCircle(pos, parseInt(radius) || 200);
    mapInstance.current.panTo(pos);
    mapInstance.current.setZoom(16);
  }, [radius, onChange]);

  const drawCircle = (center, radiusMeters) => {
    if (circleRef.current) circleRef.current.setMap(null);
    circleRef.current = new window.google.maps.Circle({
      map: mapInstance.current,
      center,
      radius: radiusMeters,
      fillColor: '#4f46e5',
      fillOpacity: 0.15,
      strokeColor: '#4f46e5',
      strokeOpacity: 0.8,
      strokeWeight: 2,
    });
  };

  // Init map
  useEffect(() => {
    if (!mapReady || !mapRef.current || mapInstance.current) return;

    const center = lat && lng
      ? { lat: parseFloat(lat), lng: parseFloat(lng) }
      : { lat: 20.5937, lng: 78.9629 };

    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      zoom: lat && lng ? 15 : 5,
      center,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    mapInstance.current.addListener('click', (e) => {
      const nLat = e.latLng.lat();
      const nLng = e.latLng.lng();
      placeMarker(nLat, nLng);
      onChange({ lat: nLat.toFixed(6), lng: nLng.toFixed(6) });
    });

    if (lat && lng) placeMarker(parseFloat(lat), parseFloat(lng));
  }, [mapReady]);

  // Init Autocomplete AFTER map is ready and input is visible
  useEffect(() => {
    if (!mapReady || !searchRef.current || autocompleteRef.current) return;

    // Small delay to ensure DOM is fully painted
    const timer = setTimeout(() => {
      try {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(
          searchRef.current,
          { fields: ['geometry', 'name', 'formatted_address'] }
        );

        // Prevent form submit on Enter key in search
        searchRef.current.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') e.preventDefault();
        });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          if (!place?.geometry?.location) return;
          const nLat = place.geometry.location.lat();
          const nLng = place.geometry.location.lng();
          setSearchValue(place.formatted_address || place.name || '');
          placeMarker(nLat, nLng);
          onChange({ lat: nLat.toFixed(6), lng: nLng.toFixed(6) });
        });
      } catch (e) {
        console.error('Autocomplete init error:', e);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [mapReady]);

  // Update circle when radius prop changes
  useEffect(() => {
    if (!mapInstance.current || !markerRef.current) return;
    drawCircle(markerRef.current.getPosition(), parseInt(radius) || 200);
  }, [radius]);

  const handleClear = () => {
    if (markerRef.current) { markerRef.current.setMap(null); markerRef.current = null; }
    if (circleRef.current) { circleRef.current.setMap(null); circleRef.current = null; }
    setSearchValue('');
    onChange({ lat: '', lng: '' });
  };

  return (
    <div className="location-picker">
      <div className="location-search-wrap">
        <span className="location-search-icon">🔍</span>
        <input
          ref={searchRef}
          type="text"
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          placeholder="Search location (e.g. Connaught Place, Delhi)..."
          className="location-search-input"
          autoComplete="off"
        />
        {(lat || lng) && (
          <button type="button" className="location-clear-btn" onClick={handleClear} title="Clear">✕</button>
        )}
      </div>

      {mapError && <div className="error-msg">{mapError}</div>}
      {!mapReady && !mapError && <div className="map-loading">⏳ Loading map...</div>}
      <div ref={mapRef} className="location-map" style={{ display: mapReady ? 'block' : 'none' }} />

      {lat && lng ? (
        <div className="location-coords-display">
          <span>📍 <strong>{parseFloat(lat).toFixed(6)}</strong>, <strong>{parseFloat(lng).toFixed(6)}</strong></span>
          <span className="muted"> · Radius: {radius || 200}m</span>
        </div>
      ) : (
        <p className="field-hint">🖱️ Search a location above or click anywhere on the map to set the campaign location</p>
      )}
    </div>
  );
};

export default LocationPicker;
