// Geocoding via the free OpenStreetMap Nominatim API (no key required).
// Usage policy: <=1 request/second and a valid User-Agent identifying the app.
// https://nominatim.org/release-docs/develop/api/Search/

const NOMINATIM = "https://nominatim.openstreetmap.org/search";

export async function geocodeAddress(address) {
  if (!address) return null;
  const url = `${NOMINATIM}?format=json&limit=1&q=${encodeURIComponent(address)}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "SaveLife/1.0 (donation matching thesis project)",
        "Accept-Language": "en",
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    };
  } catch (err) {
    console.error("Geocode failed for", address, "-", err.message);
    return null;
  }
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
