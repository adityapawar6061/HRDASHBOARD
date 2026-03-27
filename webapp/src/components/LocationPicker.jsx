import { useEffect, useRef, useState } from 'react';

const LocationPicker = ({ lat, lng, radius, onChange }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const searchRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  // Wait for Google Maps to be available
  useEffect(() => {
    const check = setInterval(() => {
      if (window.google?.maps) { setMapReady(true); clearInterval(check); }
    }, 200);
    return () => clearInterval(check);
  }, []);

  // Init map once Google is ready
  useEffect(() => {
    if (!mapReady || !mapRef.current || mapInstance.current) return;

    const center = lat && lng
      ? { lat: parseFloat(lat), lng: parseFloat(lng) }
      : { lat: 20.5937, lng: 78.9629 }; // Default: India center

    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      zoom: lat && lng ? 15 : 5,
      center,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    // Click on map to place marker
    mapInstance.current.addListener('click', (e) => {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      placeMarker(newLat, newLng);
      onChange({ lat: newLat.toFixed(6), lng: newLng.toFixed(6) });
    });

    // Init Places Autocomplete
    if (searchRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(searchRef.current, {
        fields: ['geometry', 'formatted_address', 'name'],
      });
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (!place.geometry?.location) return;
        const newLat = place.geometry.location.lat();
        const newLng = place.geometry.location.lng();
        mapInstance.current.setCenter({ lat: newLat, lng: newLng });
        mapInstance.current.setZoom(16);
        placeMarker(newLat, newLng);
        onChange({ lat: newLat.toFixed(6), lng: newLng.toFixed(6) });
      });
    }

    // If lat/lng already set, place marker immediately
    if (lat && lng) {
      placeMarker(parseFloat(lat), parseFloat(lng));
    }
  }, [mapReady]);

  // Update circle when radius changes
  useEffect(() => {
    if (!mapInstance.current || !markerRef.current) return;
    drawCircle(markerRef.current.getPosition(), parseInt(radius) || 200);
  }, [radius]);

  const placeMarker = (lat, lng) => {
    const pos = new window.google.maps.LatLng(lat, lng);

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

      // Drag marker to update coords
      markerRef.current.addListener('dragend', (e) => {
        const newLat = e.latLng.lat();
        const newLng = e.latLng.lng();
        drawCircle(e.latLng, parseInt(radius) || 200);
        onChange({ lat: newLat.toFixed(6), lng: newLng.toFixed(6) });
      });
    }

    drawCircle(pos, parseInt(radius) || 200);
    mapInstance.current.panTo(pos);
  };

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

  const handleClear = () => {
    if (markerRef.current) { markerRef.current.setMap(null); markerRef.current = null; }
    if (circleRef.current) { circleRef.current.setMap(null); circleRef.current = null; }
    if (searchRef.current) searchRef.current.value = '';
    onChange({ lat: '', lng: '' });
  };

  return (
    <div className="location-picker">
      {/* Search Box */}
      <div className="location-search-wrap">
        <span className="location-search-icon">🔍</span>
        <input
          ref={searchRef}
          type="text"
          placeholder="Search location by name (e.g. Connaught Place, Delhi)..."
          className="location-search-input"
        />
        {(lat || lng) && (
          <button type="button" className="location-clear-btn" onClick={handleClear} title="Clear location">✕</button>
        )}
      </div>

      {/* Map */}
      {!mapReady && (
        <div className="map-loading">⏳ Loading map...</div>
      )}
      <div ref={mapRef} className="location-map" style={{ display: mapReady ? 'block' : 'none' }} />

      {/* Coords display */}
      {lat && lng ? (
        <div className="location-coords-display">
          <span>📍 <strong>{parseFloat(lat).toFixed(6)}</strong>, <strong>{parseFloat(lng).toFixed(6)}</strong></span>
          <span className="muted"> · Radius: {radius || 200}m</span>
        </div>
      ) : (
        <p className="field-hint">🖱️ Click on the map or search above to set the campaign location</p>
      )}
    </div>
  );
};

export default LocationPicker;
