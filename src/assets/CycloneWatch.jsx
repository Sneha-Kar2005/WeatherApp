import { useEffect, useState } from "react";
import Stack from "@mui/material/Stack";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";

import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import CycloneRoundedIcon from "@mui/icons-material/CycloneRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import AirRoundedIcon from "@mui/icons-material/AirRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";

import { CYCLONE_LIST_URL, CYCLONE_TRACK_URL, CYCLONE_DANGER_KM, CYCLONE_WATCH_KM } from "./config";
import { haversineKm } from "./weatherUtils";
import WeatherMap from "./WeatherMap";

const ALERT_SEVERITY = { Green: "success", Orange: "warning", Red: "error" };

const RECENT_DAYS = 7;

function isOngoing(props) {
  if (props.iscurrent === "true" || props.iscurrent === true) return true;
  const now = Date.now();
  return new Date(props.fromdate).getTime() <= now && now <= new Date(props.todate).getTime();
}

// GDACS's event list is a historical archive, not just "active now" systems
// — a "nearest" event can easily be a storm from months or years ago. Only
// treat a nearby event as an active threat if it's ongoing or ended very
// recently; otherwise it's just informational history, not a current risk.
function isRecentOrOngoing(props) {
  if (isOngoing(props)) return true;
  const daysSinceEnded = (Date.now() - new Date(props.todate).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceEnded <= RECENT_DAYS;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

// Parses a GDACS geometry FeatureCollection into track segments and an
// uncertainty cone. Each GDACS "Line_Line_N" feature is one segment of the
// storm's path and carries an official `forecast` flag (true = part of the
// JTWC forecast advisory, false = already observed) — segments are drawn
// independently rather than stitched into a single ordered line, since the
// raw feed isn't guaranteed to form one clean chronological chain.
function parseTrack(geometry, coords) {
  const features = geometry?.features ?? [];

  const segments = features
    .filter((f) => f.properties?.Class?.startsWith("Line_Line_") && f.geometry?.type === "LineString")
    .map((f) => ({
      positions: f.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
      isForecast: Boolean(f.properties.forecast),
      category: f.properties.polygonlabel,
    }));

  const coneFeature = features.find((f) => f.properties?.Class === "Poly_Cones");
  const coneCoordinates = coneFeature?.geometry?.coordinates?.[0]?.map(([lon, lat]) => [lat, lon]);

  const forecastPoints = segments
    .filter((s) => s.isForecast)
    .flatMap((s) => s.positions)
    .map(([lat, lon]) => ({
      lat,
      lon,
      distanceKm: coords ? haversineKm(coords.lat, coords.lon, lat, lon) : null,
    }));

  const closestApproach = forecastPoints.length
    ? forecastPoints.reduce((min, p) => (p.distanceKm < min.distanceKm ? p : min))
    : null;

  const categories = [...new Set(segments.map((s) => s.category).filter(Boolean))];

  return { segments, coneCoordinates, closestApproach, categories, hasForecast: forecastPoints.length > 0 };
}

function EventTrack({ eventId, episodeId, coords, cityLabel }) {
  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`${CYCLONE_TRACK_URL}?eventtype=TC&eventid=${eventId}&episodeid=${episodeId}`);
        if (!res.ok) throw new Error("track unavailable");
        const geometry = await res.json();
        if (!cancelled) setTrack(parseTrack(geometry, coords));
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId, episodeId, coords]);

  if (loading) {
    return (
      <Stack sx={{ alignItems: "center", py: 3 }}>
        <CircularProgress size={22} />
      </Stack>
    );
  }

  if (error || !track) {
    return (
      <Typography variant="body2" sx={{ opacity: 0.7 }}>
        Couldn&rsquo;t load the official track for this system right now.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {track.hasForecast ? (
        <Alert severity="warning" icon={<TimelineRoundedIcon />}>
          <AlertTitle>Closest point on the forecast track</AlertTitle>
          ~{Math.round(track.closestApproach.distanceKm)} km from {cityLabel}, along the official
          JTWC-sourced forecast segment of this track (via GDACS).
        </Alert>
      ) : (
        <Typography variant="caption" sx={{ opacity: 0.6 }}>
          This system has no active forecast segment right now (event archived/dissipated) &mdash;
          showing its recorded path only.
        </Typography>
      )}

      {coords && track.segments.length > 0 && (
        <WeatherMap
          center={coords}
          label={cityLabel}
          segments={track.segments}
          coneCoordinates={track.coneCoordinates}
        />
      )}

      {track.categories.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
          {track.categories.map((c) => (
            <Chip key={c} size="small" label={c} sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />
          ))}
        </Stack>
      )}

      <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", rowGap: 0.5 }}>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          <Box sx={{ width: 16, height: 3, bgcolor: "#ffb020", borderRadius: 1 }} />
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            Observed track
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              width: 16,
              height: 0,
              borderTop: "3px dashed #ff6b6b",
            }}
          />
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            Forecast segment
          </Typography>
        </Stack>
      </Stack>
    </Stack>
  );
}

export default function CycloneWatch({ coords, cityLabel }) {
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(CYCLONE_LIST_URL);
        if (!res.ok) throw new Error("cyclone feed unavailable");
        const data = await res.json();
        if (!cancelled) setEvents(data.features ?? []);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Stack spacing={1} sx={{ alignItems: "center", py: 4 }}>
        <CircularProgress size={28} />
        <Typography variant="body2" sx={{ opacity: 0.7 }}>
          Checking live cyclone alerts (GDACS)&hellip;
        </Typography>
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert severity="info" sx={{ maxWidth: 640, mx: "auto" }}>
        <AlertTitle>Cyclone feed unreachable</AlertTitle>
        Couldn&rsquo;t reach the live GDACS tropical-cyclone feed right now. For official
        forecasts, check{" "}
        <Link href="https://mausam.imd.gov.in/" target="_blank" rel="noreferrer">
          IMD
        </Link>{" "}
        or{" "}
        <Link href="https://www.gdacs.org/" target="_blank" rel="noreferrer">
          GDACS
        </Link>
        .
      </Alert>
    );
  }

  const withDistance = (events ?? [])
    .filter((f) => f.geometry?.coordinates?.length === 2)
    .map((f) => {
      const [lon, lat] = f.geometry.coordinates;
      const distanceKm = coords ? haversineKm(coords.lat, coords.lon, lat, lon) : null;
      return { ...f, distanceKm };
    })
    .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));

  const nearest = withDistance[0];
  const nearestIsCurrent = nearest && isRecentOrOngoing(nearest.properties);
  const withinDanger = nearest && nearest.distanceKm <= CYCLONE_DANGER_KM && nearestIsCurrent;
  const withinWatch = nearest && nearest.distanceKm <= CYCLONE_WATCH_KM && nearestIsCurrent;

  return (
    <Stack spacing={2} className="fade-in" sx={{ maxWidth: 760, mx: "auto" }}>
      {withinDanger ? (
        <Alert severity="error" icon={<CycloneRoundedIcon />}>
          <AlertTitle>Active tropical cyclone activity near {cityLabel}</AlertTitle>
          {nearest.properties.name} is active and was tracked ~{Math.round(nearest.distanceKm)} km
          from your location. Expand it below for its forecast track, or monitor official alerts
          closely.
        </Alert>
      ) : withinWatch ? (
        <Alert severity="warning" icon={<CycloneRoundedIcon />}>
          <AlertTitle>Cyclone watch zone</AlertTitle>
          {nearest.properties.name} is active, recorded ~{Math.round(nearest.distanceKm)} km away
          &mdash; outside immediate danger range, but worth keeping an eye on.
        </Alert>
      ) : (
        <Alert severity="success" icon={<CycloneRoundedIcon />}>
          <AlertTitle>No active cyclone threats right now</AlertTitle>
          {cityLabel} has no ongoing or recent (last {RECENT_DAYS} days) tropical cyclone within{" "}
          {CYCLONE_WATCH_KM.toLocaleString()} km.{" "}
          {nearest &&
            `The closest system in GDACS's history, ${nearest.properties.name} (${formatDate(
              nearest.properties.todate
            )}), was ~${Math.round(nearest.distanceKm).toLocaleString()} km away — shown below for reference, not as a current risk.`}
        </Alert>
      )}

      <Typography variant="caption" sx={{ opacity: 0.6, px: 0.5 }}>
        Live feed from GDACS (EU Joint Research Centre / JTWC). Expanding an event loads its
        official forecast track and uncertainty cone where available &mdash; always cross-check
        with your national meteorological agency (e.g. IMD for India) before making safety
        decisions.
      </Typography>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />

      <Stack spacing={1.5}>
        {withDistance.slice(0, 8).map((f) => {
          const p = f.properties;
          const ongoing = isOngoing(p);
          const key = `${p.eventid}-${p.episodeid}`;

          return (
            <Accordion
              key={key}
              expanded={expanded === key}
              onChange={() => setExpanded(expanded === key ? null : key)}
              sx={{
                bgcolor: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(18px)",
                border: "1px solid rgba(255,255,255,0.12)",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                <Stack spacing={0.5} sx={{ width: "100%" }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {p.name}
                    </Typography>
                    {ongoing && <Chip size="small" color="error" label="Ongoing" />}
                    <Chip
                      size="small"
                      color={ALERT_SEVERITY[p.alertlevel] ?? "default"}
                      label={p.alertlevel}
                      variant="outlined"
                    />
                  </Stack>

                  <Typography variant="body2" sx={{ opacity: 0.75 }}>
                    {p.severitydata?.severitytext}
                  </Typography>

                  <Stack direction="row" spacing={2} sx={{ alignItems: "center", mt: 0.5, flexWrap: "wrap" }}>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                      <PlaceRoundedIcon fontSize="inherit" sx={{ opacity: 0.6 }} />
                      <Typography variant="caption">
                        {f.distanceKm != null ? `${Math.round(f.distanceKm).toLocaleString()} km away` : "--"}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                      <AirRoundedIcon fontSize="inherit" sx={{ opacity: 0.6 }} />
                      <Typography variant="caption">{p.country}</Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ opacity: 0.55 }}>
                      {formatDate(p.fromdate)} &ndash; {formatDate(p.todate)}
                    </Typography>
                  </Stack>
                </Stack>
              </AccordionSummary>

              <AccordionDetails>
                <Stack spacing={1.5}>
                  {expanded === key && (
                    <EventTrack eventId={p.eventid} episodeId={p.episodeid} coords={coords} cityLabel={cityLabel} />
                  )}

                  <Box>
                    <Link
                      href={p.url?.report}
                      target="_blank"
                      rel="noreferrer"
                      sx={{ display: "flex", alignItems: "center", gap: 0.5, width: "fit-content" }}
                    >
                      Official GDACS report
                      <OpenInNewRoundedIcon fontSize="inherit" />
                    </Link>
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>
          );
        })}

        {withDistance.length === 0 && (
          <Typography variant="body2" sx={{ opacity: 0.7, textAlign: "center" }}>
            No tropical cyclone events currently published by GDACS.
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}
