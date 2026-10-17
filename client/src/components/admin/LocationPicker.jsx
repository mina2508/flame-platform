import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon with bundlers.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Recenter the map when coordinates change (e.g. after a search pick).
function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) map.setView([lat, lng], 15);
  }, [lat, lng, map]);
  return null;
}

// Draggable marker that reports its position back up.
function DraggableMarker({ lat, lng, onMove }) {
  const ref = useRef(null);
  const map = useMap();
  // Allow clicking the map to move the pin too.
  useEffect(() => {
    function onClick(e) { onMove(e.latlng.lat, e.latlng.lng); }
    map.on('click', onClick);
    return () => map.off('click', onClick);
  }, [map, onMove]);

  if (lat == null || lng == null) return null;
  return (
    <Marker
      draggable
      position={[lat, lng]}
      ref={ref}
      eventHandlers={{
        dragend() {
          const m = ref.current;
          if (m) { const p = m.getLatLng(); onMove(p.lat, p.lng); }
        },
      }}
    />
  );
}

/**
 * LocationPicker — search by name/city/country via OpenStreetMap (free, no API key),
 * then confirm/drag the pin on an interactive map. Reports lat/lng up via onChange.
 *
 * Props:
 *  - value: { latitude, longitude }
 *  - onChange: (lat, lng) => void
 *  - nameHint / cityHint / countryHint: prefill the search query
 */
export default function LocationPicker({ value, onChange, nameHint = '', cityHint = '', countryHint = '' }) {
  const [query, setQuery] = useState([nameHint, cityHint, countryHint].filter(Boolean).join(', '));
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [err, setErr] = useState('');
  const [showMap, setShowMap] = useState(!!(value?.latitude && value?.longitude));

  const lat = value?.latitude ?? null;
  const lng = value?.longitude ?? null;

  async function search(e) {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setErr('');
    setResults([]);
    try {
      const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=6&q=' + encodeURIComponent(q);
      const r = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const data = await r.json();
      if (!data.length) setErr('No matches found. Try adding the city or country, or drop the pin manually.');
      setResults(data);
      setShowMap(true);
    } catch {
      setErr('Search failed. Check your connection or drop the pin manually on the map.');
    } finally {
      setSearching(false);
    }
  }

  function pick(r) {
    const la = parseFloat(r.lat), lo = parseFloat(r.lon);
    onChange(la, lo);
    setResults([]);
    setShowMap(true);
  }

  const center = (lat != null && lng != null) ? [lat, lng] : [0, 20]; // default: Africa-ish

  return (
    <div className="rounded-xl border p-3" style={{ borderColor: 'var(--line)', background: '#fff' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-black uppercase" style={{ color: 'var(--muted)' }}>📍 Location on map</span>
        {lat != null && lng != null && (
          <span className="text-xs" style={{ color: 'var(--good)' }}>
            ✓ {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
          </span>
        )}
      </div>

      <form onSubmit={search} className="flex gap-2 flex-wrap">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search e.g. 'St. Paul School, Accra, Ghana'"
          className="border rounded-xl px-3 py-2 text-sm flex-1 min-w-[180px]"
          style={{ borderColor: 'var(--line)' }}
        />
        <button type="submit" disabled={searching} className="pill-btn pill-btn-primary text-sm" style={{ opacity: searching ? 0.6 : 1 }}>
          {searching ? 'Searching…' : '🔍 Search'}
        </button>
        {!showMap && (
          <button type="button" onClick={() => setShowMap(true)} className="pill-btn text-sm">Drop pin manually</button>
        )}
      </form>

      {err && <p className="text-xs mt-2" style={{ color: 'var(--danger)' }}>{err}</p>}

      {results.length > 0 && (
        <ul className="mt-2 rounded-xl border divide-y" style={{ borderColor: 'var(--line)' }}>
          {results.map((r, i) => (
            <li key={i}>
              <button type="button" onClick={() => pick(r)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-soft"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)' }}>
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {showMap && (
        <>
          <p className="text-xs mt-3 mb-1" style={{ color: 'var(--muted)' }}>
            Click the map or drag the pin to fine-tune the exact spot.
          </p>
          <div style={{ height: 260, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line)' }}>
            <MapContainer center={center} zoom={lat != null ? 15 : 3} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Recenter lat={lat} lng={lng} />
              <DraggableMarker lat={lat} lng={lng} onMove={onChange} />
            </MapContainer>
          </div>
          {lat != null && lng != null && (
            <button type="button" onClick={() => onChange(null, null)} className="text-xs font-bold mt-2" style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Clear location
            </button>
          )}
        </>
      )}
    </div>
  );
}
