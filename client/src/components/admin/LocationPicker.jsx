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

// Recenter / zoom the map when coordinates change (after a search pick).
function Recenter({ lat, lng, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) map.setView([lat, lng], zoom || 15, { animate: true });
  }, [lat, lng, zoom, map]);
  return null;
}

// Draggable marker + click-to-place. Reports position up.
function DraggableMarker({ lat, lng, onMove }) {
  const ref = useRef(null);
  const map = useMap();
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

// Debounce helper
function useDebouncedCallback(fn, delay) {
  const t = useRef(null);
  return (...args) => {
    clearTimeout(t.current);
    t.current = setTimeout(() => fn(...args), delay);
  };
}

/**
 * LocationPicker — accurate location selection with OpenStreetMap (free, no key).
 * - Type to search (debounced, live suggestions).
 * - Falls back to city/country so you always land in the right area.
 * - Interactive map: click or drag the pin to the exact spot.
 * - Shows the address of wherever the pin currently is (reverse geocode).
 */
export default function LocationPicker({ value, onChange, nameHint = '', cityHint = '', countryHint = '' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [note, setNote] = useState('');
  const [currentAddr, setCurrentAddr] = useState('');

  const lat = value?.latitude ?? null;
  const lng = value?.longitude ?? null;
  const hasPin = lat != null && lng != null;

  // Prefill the query from hints the first time they change.
  useEffect(() => {
    const q = [nameHint, cityHint, countryHint].filter(Boolean).join(', ');
    if (q && !query) setQuery(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameHint, cityHint, countryHint]);

  async function nominatim(q) {
    const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=8&q=' + encodeURIComponent(q);
    const r = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    return r.ok ? r.json() : [];
  }

  async function runSearch(q) {
    const term = (q ?? query).trim();
    if (!term) { setResults([]); return; }
    setSearching(true);
    setNote('');
    try {
      let data = await nominatim(term);
      // Fallback 1: drop the first part (often the exact school name OSM lacks)
      if (!data.length && term.includes(',')) {
        const broader = term.split(',').slice(1).join(',').trim();
        if (broader) {
          data = await nominatim(broader);
          if (data.length) setNote('Exact name not found — showing the area. Drag the pin to the school.');
        }
      }
      // Fallback 2: just the city/country hints
      if (!data.length) {
        const area = [cityHint, countryHint].filter(Boolean).join(', ');
        if (area) {
          data = await nominatim(area);
          if (data.length) setNote('Showing the city/country. Drag the pin to the exact school.');
        }
      }
      if (!data.length) setNote('No matches. Zoom the map and click/drag to place the pin manually.');
      setResults(data);
    } catch {
      setNote('Search failed. Place the pin manually on the map.');
    } finally {
      setSearching(false);
    }
  }

  const debouncedSearch = useDebouncedCallback(runSearch, 450);

  function onType(v) {
    setQuery(v);
    if (v.trim().length >= 3) debouncedSearch(v);
    else setResults([]);
  }

  function pick(r) {
    const la = parseFloat(r.lat), lo = parseFloat(r.lon);
    onChange(la, lo);
    setResults([]);
    setNote('Pin placed. Drag it to fine-tune the exact building.');
  }

  // Reverse geocode the current pin so the user can confirm the spot.
  useEffect(() => {
    if (!hasPin) { setCurrentAddr(''); return; }
    let cancelled = false;
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    fetch(url, { headers: { 'Accept-Language': 'en' } })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (!cancelled && d) setCurrentAddr(d.display_name || ''); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [lat, lng, hasPin]);

  const center = hasPin ? [lat, lng] : [5, 10]; // default: central/west Africa-ish

  return (
    <div className="rounded-xl border p-3" style={{ borderColor: 'var(--line)', background: '#fff' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-black uppercase" style={{ color: 'var(--muted)' }}>📍 Location on map</span>
        {hasPin && (
          <span className="text-xs" style={{ color: 'var(--good)' }}>
            ✓ {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
          </span>
        )}
      </div>

      {/* Search box — live suggestions as you type */}
      <div className="relative">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={e => onType(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); runSearch(); } }}
            placeholder="Search place, city or country (e.g. 'Accra, Ghana')"
            className="border rounded-xl px-3 py-2 text-sm flex-1"
            style={{ borderColor: 'var(--line)' }}
          />
          <button type="button" onClick={() => runSearch()} disabled={searching} className="pill-btn pill-btn-primary text-sm" style={{ opacity: searching ? 0.6 : 1 }}>
            {searching ? '…' : '🔍'}
          </button>
        </div>

        {results.length > 0 && (
          <ul className="absolute z-[1000] left-0 right-0 mt-1 rounded-xl border bg-white shadow-lg max-h-60 overflow-auto divide-y"
            style={{ borderColor: 'var(--line)' }}>
            {results.map((r, i) => (
              <li key={i}>
                <button type="button" onClick={() => pick(r)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-soft"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)' }}>
                  <span className="block font-semibold" style={{ color: 'var(--ink)' }}>{r.name || r.display_name.split(',')[0]}</span>
                  <span className="block text-xs" style={{ color: 'var(--muted)' }}>{r.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {note && <p className="text-xs mt-2" style={{ color: 'var(--watch)' }}>{note}</p>}

      {/* Map is always visible so you can zoom + click to place the pin anywhere */}
      <p className="text-xs mt-3 mb-1" style={{ color: 'var(--muted)' }}>
        Click anywhere on the map or drag the pin to set the exact school location.
      </p>
      <div style={{ height: 300, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line)' }}>
        <MapContainer center={center} zoom={hasPin ? 15 : 4} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Recenter lat={lat} lng={lng} />
          {/* If no pin yet, clicking the map places one */}
          <ClickToPlace hasPin={hasPin} onMove={onChange} />
          <DraggableMarker lat={lat} lng={lng} onMove={onChange} />
        </MapContainer>
      </div>

      {currentAddr && (
        <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>📌 {currentAddr}</p>
      )}
      {hasPin && (
        <button type="button" onClick={() => { onChange(null, null); setCurrentAddr(''); }} className="text-xs font-bold mt-2" style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
          Clear location
        </button>
      )}
    </div>
  );
}

// Lets the user click the empty map to drop the first pin.
function ClickToPlace({ hasPin, onMove }) {
  const map = useMap();
  useEffect(() => {
    if (hasPin) return;
    function onClick(e) { onMove(e.latlng.lat, e.latlng.lng); }
    map.on('click', onClick);
    return () => map.off('click', onClick);
  }, [map, hasPin, onMove]);
  return null;
}
