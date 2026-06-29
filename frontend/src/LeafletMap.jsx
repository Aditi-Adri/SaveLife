import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./LeafletMap.css";

// Interactive map using Leaflet + OpenStreetMap tiles (no API key).
// markers: [{ id, lat, lng, label, popupHtml }]
// userLocation: { lat, lng } | null
// route: [[lat,lng], ...] | null  (a driving route polyline to draw)
export default function LeafletMap({ markers = [], userLocation = null, route = null, height = 320 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  // Initialise the map once.
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(
      [23.78, 90.41], // Dhaka fallback
      11
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    // Leaflet sometimes needs a nudge once the container has its final size.
    setTimeout(() => map.invalidateSize(), 100);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Redraw markers whenever the data changes.
  useEffect(() => {
    const map = mapRef.current;
    const group = layerRef.current;
    if (!map || !group) return;
    group.clearLayers();

    const points = [];

    markers.forEach((m) => {
      if (m.lat == null || m.lng == null) return;
      const icon = L.divIcon({
        className: "sl-pin",
        html: `<span class="sl-pin-bubble">${m.label ?? "📍"}</span>`,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -32],
      });
      const marker = L.marker([m.lat, m.lng], { icon }).addTo(group);
      if (m.popupHtml) marker.bindPopup(m.popupHtml);
      points.push([m.lat, m.lng]);
    });

    if (userLocation) {
      const icon = L.divIcon({
        className: "sl-pin sl-pin-user",
        html: `<span class="sl-pin-bubble user">You</span>`,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -32],
      });
      L.marker([userLocation.lat, userLocation.lng], { icon })
        .addTo(group)
        .bindPopup("Your location");
      points.push([userLocation.lat, userLocation.lng]);
    }

    if (route && route.length > 1) {
      L.polyline(route, { color: "#ef4444", weight: 5, opacity: 0.8 }).addTo(group);
      route.forEach((p) => points.push(p));
    }

    // When a route is shown, frame the route; otherwise frame all points.
    const frame = route && route.length > 1 ? route : points;
    if (frame.length === 1) map.setView(frame[0], 13);
    else if (frame.length > 1) map.fitBounds(frame, { padding: [40, 40] });
  }, [markers, userLocation, route]);

  return <div ref={containerRef} className="leaflet-host" style={{ height }} />;
}
