// Haversine distance (km) between two {lat,lng} points.
export function distanceKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function fmtKm(km) {
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

// Get the browser's current position as a promise of {lat,lng}.
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolocation not supported"));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error("Couldn't get your location. Please allow location access.")),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

// Driving route from origin to destination via the public OSRM API (no key).
// Returns { coords: [[lat,lng],...], km, min } or null.
export async function fetchRoute(origin, dest) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${origin.lng},${origin.lat};${dest.lng},${dest.lat}` +
    `?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Routing service error");
  const data = await res.json();
  const route = data.routes && data.routes[0];
  if (!route) return null;
  return {
    coords: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    km: route.distance / 1000,
    min: Math.round(route.duration / 60),
  };
}
