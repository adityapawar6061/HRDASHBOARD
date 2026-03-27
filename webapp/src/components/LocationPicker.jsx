import { useEffect, useRef, useState } from 'react';

// Singleton promise — only loads once no matter how many times component mounts
let mapsPromise = null;

const loadGoogleMaps = () => {
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise((resolve, reject) => {
    // Already loaded
    if (window.google?.maps?.places) { resolve(); return; }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => { mapsPromise = null; reject(new Error('Google Maps failed to load')); };
    document.head.appendChild(script);
  });
  return mapsPromise;
};

const LocationPicker = ({ lat, lng, radius, onChange }) => {
  const mapRef       = useRef(null);
  const mapObj       = useRef(null);
  const markerObj    = useRef(null);
  const circleObj    = useRef(null);
  const inputRef     = useRef(null);
  const acRef        = useRef(null);
  const [ready, setReady]   = useState(false);
  const [error, setError]   = useState('');
  const [search, setSearch] = useState('');

  /* ── 1. Load SDK ── */
  useEffect(() => {
    loadGoogleMaps().then(() => setReady(true)).catch(e => setError(e.message));
  }, []);

  /* ── 2. Init map ── */
  useEffect(() => {
    if (!ready || !mapRef.current || mapObj.current) return;

    const center = lat && lng
      ? { lat: +lat, lng: +lng }
      : { lat: 20.5937, lng: 78.9629 };

    mapObj.current = new window.google.maps.Map(mapRef.current, {
      zoom: lat && lng ? 15 : 5,
      center,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    mapObj.current.addListener('click', e => {
      drop(e.latLng.lat(), e.latLng.lng());
      onChange({ lat: e.latLng.lat().toFixed(6), lng: e.latLng.lng().toFixed(6) });
    });

    if (lat && lng) drop(+lat, +lng);
  }, [ready]); // eslint-disable-line

  /* ── 3. Init Autocomplete (after map ready + input mounted) ── */
  useEffect(() => {
    if (!ready || !inputRef.current || acRef.current) return;

    acRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ['geometry', 'formatted_address', 'name'],
    });

    acRef.current.addListener('place_changed', () => {
      const place = acRef.current.getPlace();
      if (!place?.geometry?.location) return;
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setSearch(place.formatted_address || place.name || '');
      drop(lat, lng);
      onChange({ lat: lat.toFixed(6), lng: lng.toFixed(6) });
    });
  }, [ready]); // eslint-disable-line

  /* ── 4. Redraw circle when radius changes ── */
  useEffect(() => {
    if (markerObj.current) drawCircle(markerObj.current.getPosition(), +radius || 200);
  }, [radius]); // eslint-disable-line

  const drop = (lat, lng) => {
    const pos = new window.google.maps.LatLng(lat, lng);
    if (markerObj.current) {
      markerObj.current.setPosition(pos);
    } else {
      markerObj.current = new window.google.maps.Marker({
        map: mapObj.current, position: pos,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
      });
      markerObj.current.addListener('dragend', e => {
        drawCircle(e.latLng, +radius || 200);
        onChange({ lat: e.latLng.lat().toFixed(6), lng: e.latLng.lng().toFixed(6) });
      });
    }
    drawCircle(pos, +radius || 200);
    mapObj.current.panTo(pos);
    mapObj.current.setZoom(16);
  };

  const drawCircle = (center, r) => {
    if (circleObj.current) circleObj.current.setMap(null);
    circleObj.current = new window.google.maps.Circle({
      map: mapObj.current, center, radius: r,
      fillColor: '#4f46e5', fillOpacity: 0.15,
      strokeColor: '#4f46e5', strokeOpacity: 0.8, strokeWeight: 2,
    });
  };

  const clear = () => {
    markerObj.current?.setMap(null); markerObj.current = null;
    circleObj.current?.setMap(null); circleObj.current = null;
    setSearch('');
    onChange({ lat: '', lng: '' });
  };

  return (
    <div className="location-picker">
      {/* Search */}
      <div className="location-search-wrap">
        <span className="location-search-icon">🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
          placeholder="Search location (e.g. Connaught Place, Delhi)..."
          className="location-search-input"
          autoComplete="off"
        />
        {(lat || lng) && (
          <button type="button" className="location-clear-btn" onClick={clear}>✕</button>
        )}
      </div>

      {error && <div className="error-msg">⚠️ {error} — Make sure Maps JavaScript API &amp; Places API are enabled in Google Cloud Console.</div>}
      {!ready && !error && <div className="map-loading">⏳ Loading map...</div>}
      <div ref={mapRef} className="location-map" style={{ display: ready ? 'block' : 'none' }} />

      {lat && lng
        ? <div className="location-coords-display">📍 <strong>{(+lat).toFixed(6)}</strong>, <strong>{(+lng).toFixed(6)}</strong> <span className="muted">· {radius || 200}m radius</span></div>
        : <p className="field-hint">🖱️ Search above or click the map to set location</p>
      }
    </div>
  );
};

export default LocationPicker;
