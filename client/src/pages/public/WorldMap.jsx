import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../../api/client.js';

// Pan/zoom to fit all markers whenever they change.
function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 7 });
  }, [points, map]);
  return null;
}

// Fix Leaflet default marker icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom flame icon
const flameIcon = new L.DivIcon({
  html: '<div style="background:linear-gradient(135deg,#f04a18,#a71914);width:32px;height:32px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:900;font-size:14px;box-shadow:0 8px 20px rgba(167,25,20,0.3);border:3px solid #fff;">🔥</div>',
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
});

export default function WorldMap() {
  const [locations, setLocations] = useState([]);
  const [byCountry, setByCountry] = useState({});
  const [filters, setFilters] = useState({ countries: [], cities: [], countryMarkers: [] });
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');

  async function loadFilters() {
    const { data } = await api.get('/map/filters');
    setFilters({ countries: data.countries || [], cities: data.cities || [], countryMarkers: data.countryMarkers || [] });
  }

  async function loadLocations() {
    const params = {};
    if (country) params.country = country;
    if (city) params.city = city;
    const { data } = await api.get('/map/locations', { params });
    setLocations(data.locations);
    setByCountry(data.byCountry);
  }

  useEffect(() => { loadFilters(); loadLocations(); }, []);
  useEffect(() => { loadLocations(); }, [country, city]);

  // Center on Africa if locations exist
  const center = locations.length > 0
    ? [locations.reduce((s, l) => s + l.lat, 0) / locations.length, locations.reduce((s, l) => s + l.lng, 0) / locations.length]
    : [7.0, -1.0];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="fade-up">
        <p className="eyebrow">World Missions</p>
        <h1 className="font-serif text-ink" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>Mission Map</h1>
        <p className="mt-2" style={{ color: 'var(--muted)' }}>Interactive map of FLAME schools and mission locations.</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 fade-up flex items-end gap-4 flex-wrap" style={{ borderRadius: 20, animationDelay: '0.1s' }}>
        <label className="grid gap-1.5 text-xs font-black uppercase" style={{ color: 'var(--muted)' }}>
          Country
          <select value={country} onChange={e => { setCountry(e.target.value); setCity(''); }}
            className="pill-btn text-sm font-normal px-4 min-w-[160px]">
            <option value="">All Countries</option>
            {filters.countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="grid gap-1.5 text-xs font-black uppercase" style={{ color: 'var(--muted)' }}>
          City / Region
          <select value={city} onChange={e => setCity(e.target.value)}
            className="pill-btn text-sm font-normal px-4 min-w-[160px]">
            <option value="">All Cities</option>
            {filters.cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        {(country || city) && (
          <button onClick={() => { setCountry(''); setCity(''); }} className="pill-btn text-sm">Clear filters ✕</button>
        )}
        <div className="text-xs" style={{ color: 'var(--muted)' }}>
          <strong className="text-ink">{locations.length}</strong> locations · <strong className="text-ink">{Object.keys(byCountry).length}</strong> countries
        </div>
        <p className="w-full text-xs" style={{ color: 'var(--muted)' }}>Tip: click a 🌍 country bubble on the map to view its schools.</p>
      </div>

      {/* Map */}
      <div className="glass-card overflow-hidden fade-up" style={{ borderRadius: 20, animationDelay: '0.2s', height: 500 }}>
        <MapContainer center={center} zoom={4} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true} worldCopyJump={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds points={locations} />

          {/* Clickable country markers — select a country directly on the map */}
          {!country && filters.countryMarkers.map(cm => (
            <CircleMarker key={cm.name} center={[cm.lat, cm.lng]} radius={14}
              pathOptions={{ color: '#a71914', fillColor: '#34a9d6', fillOpacity: 0.65, weight: 2 }}
              eventHandlers={{ click: () => { setCountry(cm.name); setCity(''); } }}>
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif' }}>
                  <strong>🌍 {cm.name}</strong>
                  <div style={{ fontSize: 12, color: '#697383', marginTop: 4 }}>{cm.schools} school{cm.schools > 1 ? 's' : ''}</div>
                  <button onClick={() => { setCountry(cm.name); setCity(''); }}
                    style={{ marginTop: 6, padding: '4px 10px', borderRadius: 999, border: 'none', background: '#f04a18', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                    View schools
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* School markers */}
          {locations.map(loc => (
            <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={flameIcon}>
              <Popup>
                <div style={{ minWidth: 180, fontFamily: 'Inter, sans-serif' }}>
                  <strong style={{ fontSize: 14, color: '#10213a' }}>{loc.name}</strong>
                  <div style={{ marginTop: 6, fontSize: 12, color: '#697383' }}>
                    <div>📍 {loc.city || 'N/A'}, {loc.country}</div>
                    {loc.approx && <div style={{ color: '#c78a35' }}>≈ approximate (no exact coordinates)</div>}
                    <div style={{ marginTop: 4 }}>📋 {loc.missions} missions</div>
                    <div>👥 {loc.people} people</div>
                    <div style={{ marginTop: 4 }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 999,
                        fontSize: 11, fontWeight: 900,
                        color: loc.active ? '#27956a' : '#c73535',
                        background: loc.active ? 'rgba(39,149,106,0.12)' : 'rgba(199,53,53,0.12)',
                      }}>
                        {loc.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Schools by country sidebar */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(byCountry).map(([countryName, schools]) => (
          <div key={countryName} className="glass-card p-5 fade-up" style={{ borderRadius: 20 }}>
            <h3 className="font-bold text-ink flex items-center gap-2">
              <span className="text-xl">🌍</span> {countryName}
            </h3>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{schools.length} school{schools.length > 1 ? 's' : ''}</p>
            <div className="mt-3 grid gap-2">
              {schools.map(s => (
                <div key={s.id} className="rounded-xl border p-3 text-sm bg-white transition-transform hover:-translate-y-0.5"
                  style={{ borderColor: 'var(--line)' }}>
                  <strong className="text-ink">{s.name}</strong>
                  <div className="flex gap-3 mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                    <span>📍 {s.city}</span>
                    <span>📋 {s.missions}</span>
                    <span>👥 {s.people}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
