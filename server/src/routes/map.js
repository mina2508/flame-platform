import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

// Approximate country centroids so schools without exact coordinates still
// appear on the map. Add more as new countries are introduced.
const COUNTRY_CENTROIDS = {
  ghana: [7.95, -1.02], egypt: [26.82, 30.80], kenya: [-0.02, 37.91],
  nigeria: [9.08, 8.68], ethiopia: [9.15, 40.49], uganda: [1.37, 32.29],
  tanzania: [-6.37, 34.89], 'south sudan': [6.88, 31.31], sudan: [12.86, 30.22],
  'south africa': [-30.56, 22.94], 'ivory coast': [7.54, -5.55], "cote d'ivoire": [7.54, -5.55],
  togo: [8.62, 0.82], benin: [9.31, 2.32], cameroon: [7.37, 12.35], congo: [-0.23, 15.83],
  france: [46.6, 2.2], 'united states': [39.8, -98.6], usa: [39.8, -98.6], canada: [56.1, -106.3],
};

function centroidFor(name) {
  if (!name) return null;
  const key = String(name).trim().toLowerCase();
  if (COUNTRY_CENTROIDS[key]) return COUNTRY_CENTROIDS[key];
  // partial match (e.g. "St Anthony - Ghana" style country strings)
  for (const [k, v] of Object.entries(COUNTRY_CENTROIDS)) if (key.includes(k)) return v;
  return null;
}

// Deterministic small offset so multiple schools in the same country spread out.
function jitter(base, seed, i) {
  if (!base) return null;
  const d = ((seed.charCodeAt(0) + seed.charCodeAt(seed.length - 1) + i * 37) % 100) / 100; // 0..1
  return [base[0] + (d - 0.5) * 1.6, base[1] + ((d * 7 % 1) - 0.5) * 1.6];
}

// Public — returns school locations for the map, with mission counts.
// Supports optional ?country= and ?city= filters. Schools without exact
// coordinates are placed at an approximate country location so they still show.
router.get('/locations', async (req, res, next) => {
  try {
    const { country, city } = req.query;

    const schools = await prisma.school.findMany({
      include: { countryRef: true, _count: { select: { missionLogs: true, people: true } } },
    });

    const resolveCountry = (s) => s.countryRef?.name || s.country || 'Unknown';

    let enriched = schools.map((s, i) => {
      const cname = resolveCountry(s);
      let lat = s.latitude, lng = s.longitude, approx = false;
      if (lat == null || lng == null) {
        const c = jitter(centroidFor(cname), s.id, i);
        if (c) { lat = c[0]; lng = c[1]; approx = true; }
      }
      return {
        id: s.id, name: s.name, country: cname, city: s.region || s.city,
        lat, lng, approx, missions: s._count.missionLogs, people: s._count.people, active: s.active,
      };
    });

    // Apply filters after resolving country names
    if (country) enriched = enriched.filter((s) => (s.country || '').toLowerCase().includes(String(country).toLowerCase()));
    if (city) enriched = enriched.filter((s) => (s.city || '').toLowerCase().includes(String(city).toLowerCase()));

    const locations = enriched.filter((s) => s.lat != null && s.lng != null);

    // group by country for the sidebar
    const byCountry = {};
    for (const loc of locations) {
      const key = loc.country || 'Unknown';
      if (!byCountry[key]) byCountry[key] = [];
      byCountry[key].push(loc);
    }

    res.json({ locations, byCountry, total: locations.length });
  } catch (e) { next(e); }
});

// Distinct countries + cities for filter dropdowns, plus clickable country
// markers (centroid + school count) for selecting a country on the map.
router.get('/filters', async (_, res, next) => {
  try {
    const schools = await prisma.school.findMany({ include: { countryRef: true } });
    const nameOf = (s) => s.countryRef?.name || s.country || null;

    const countrySet = new Set();
    const citySet = new Set();
    const counts = {};
    for (const s of schools) {
      const cn = nameOf(s);
      if (cn) { countrySet.add(cn); counts[cn] = (counts[cn] || 0) + 1; }
      if (s.region) citySet.add(s.region);
      else if (s.city) citySet.add(s.city);
    }

    const countryMarkers = [...countrySet].map((cn) => {
      const c = centroidFor(cn);
      return c ? { name: cn, lat: c[0], lng: c[1], schools: counts[cn] || 0 } : null;
    }).filter(Boolean);

    res.json({ countries: [...countrySet].sort(), cities: [...citySet].sort(), countryMarkers });
  } catch (e) { next(e); }
});

export default router;
