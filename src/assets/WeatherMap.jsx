import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, Polygon, useMap } from "react-leaflet";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import RadarRoundedIcon from "@mui/icons-material/RadarRounded";
import "leaflet/dist/leaflet.css";

import { RAINVIEWER_FRAMES_URL } from "./config";

function Recenter({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], map.getZoom() < 4 ? 5 : map.getZoom(), { duration: 0.8 });
  }, [lat, lon, map]);
  return null;
}

// Leaflet measures its container at mount time. Inside an MUI Accordion the
// container is still animating from height 0 when that happens, so tiles
// never lay out correctly until something tells Leaflet to re-measure.
// A ResizeObserver on the container (plus a couple of delayed fallbacks)
// catches that once the collapse transition finishes.
function InvalidateOnResize() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const invalidate = () => map.invalidateSize();

    const observer = new ResizeObserver(invalidate);
    observer.observe(container);

    const timeouts = [100, 350, 600].map((ms) => setTimeout(invalidate, ms));

    return () => {
      observer.disconnect();
      timeouts.forEach(clearTimeout);
    };
  }, [map]);
  return null;
}

// Fetches RainViewer's free, keyless radar-frame index and returns a ready
// XYZ tile URL template for the latest observed precipitation frame.
function useLatestRadarFrame(enabled) {
  const [frameUrl, setFrameUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || frameUrl) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(RAINVIEWER_FRAMES_URL);
        const data = await res.json();
        const latest = data.radar?.past?.at(-1);
        if (!cancelled && latest) {
          setFrameUrl(`${data.host}${latest.path}/256/{z}/{x}/{y}/2/1_1.png`);
        }
      } catch {
        // radar is a bonus layer — silently skip it if RainViewer is unreachable
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, frameUrl]);

  return { frameUrl, loading };
}

// segments: array of { positions: [lat,lon][], isForecast } — official GDACS
// track segments, drawn independently (no assumption of a single continuous
// chronological order, since the raw data isn't always one clean chain).
// coneCoordinates: [lat,lon][] describing the GDACS uncertainty cone, if any.
export default function WeatherMap({ center, label, segments = [], coneCoordinates, showRadarToggle = true }) {
  const [radarOn, setRadarOn] = useState(false);
  const { frameUrl, loading: radarLoading } = useLatestRadarFrame(radarOn);

  if (!center) return null;

  return (
    <Card sx={{ overflow: "hidden", maxWidth: 760, mx: "auto" }}>
      {showRadarToggle && (
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", justifyContent: "flex-end", px: 1.5, py: 0.5 }}
        >
          {radarOn && radarLoading && <CircularProgress size={14} />}
          <RadarRoundedIcon fontSize="small" sx={{ opacity: 0.7 }} />
          <Typography variant="caption" sx={{ opacity: 0.75 }}>
            Rain radar
          </Typography>
          <Switch size="small" checked={radarOn} onChange={(e) => setRadarOn(e.target.checked)} />
        </Stack>
      )}

      <MapContainer
        center={[center.lat, center.lon]}
        zoom={5}
        scrollWheelZoom={false}
        style={{ height: 360, width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {radarOn && frameUrl && (
          <TileLayer
            attribution='Radar &copy; <a href="https://www.rainviewer.com/">RainViewer</a>'
            url={frameUrl}
            opacity={0.55}
          />
        )}

        <Recenter lat={center.lat} lon={center.lon} />
        <InvalidateOnResize />

        <CircleMarker
          center={[center.lat, center.lon]}
          radius={9}
          pathOptions={{ color: "#6dd5fa", fillColor: "#6dd5fa", fillOpacity: 0.9 }}
        >
          <Popup>{label}</Popup>
        </CircleMarker>

        {coneCoordinates?.length > 2 && (
          <Polygon
            positions={coneCoordinates}
            pathOptions={{ color: "#ff6b6b", weight: 1, fillColor: "#ff6b6b", fillOpacity: 0.12 }}
          />
        )}

        {segments.map((segment, i) => (
          <Polyline
            key={i}
            positions={segment.positions}
            pathOptions={{
              color: segment.isForecast ? "#ff6b6b" : "#ffb020",
              weight: 3,
              dashArray: segment.isForecast ? "6 6" : undefined,
            }}
          />
        ))}
      </MapContainer>
    </Card>
  );
}
