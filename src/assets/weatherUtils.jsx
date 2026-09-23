import ThunderstormRoundedIcon from "@mui/icons-material/ThunderstormRounded";
import AcUnitRoundedIcon from "@mui/icons-material/AcUnitRounded";
import WbSunnyRoundedIcon from "@mui/icons-material/WbSunnyRounded";
import CloudRoundedIcon from "@mui/icons-material/CloudRounded";
import GrainRoundedIcon from "@mui/icons-material/GrainRounded";
import FoggyIcon from "@mui/icons-material/Foggy";
import CloudQueueRoundedIcon from "@mui/icons-material/CloudQueueRounded";
import NightsStayRoundedIcon from "@mui/icons-material/NightsStayRounded";

// WMO weather codes (used by Open-Meteo) mapped to a human description and a
// broad "main" category, mirroring the shape the rest of the app expects.
// Reference: https://open-meteo.com/en/docs (WMO Weather interpretation codes)
const WMO_CODES = {
  0: { main: "Clear", description: "clear sky" },
  1: { main: "Clear", description: "mainly clear" },
  2: { main: "Clouds", description: "partly cloudy" },
  3: { main: "Clouds", description: "overcast" },
  45: { main: "Fog", description: "fog" },
  48: { main: "Fog", description: "depositing rime fog" },
  51: { main: "Drizzle", description: "light drizzle" },
  53: { main: "Drizzle", description: "moderate drizzle" },
  55: { main: "Drizzle", description: "dense drizzle" },
  56: { main: "Drizzle", description: "light freezing drizzle" },
  57: { main: "Drizzle", description: "dense freezing drizzle" },
  61: { main: "Rain", description: "slight rain" },
  63: { main: "Rain", description: "moderate rain" },
  65: { main: "Rain", description: "heavy rain" },
  66: { main: "Rain", description: "light freezing rain" },
  67: { main: "Rain", description: "heavy freezing rain" },
  71: { main: "Snow", description: "slight snow fall" },
  73: { main: "Snow", description: "moderate snow fall" },
  75: { main: "Snow", description: "heavy snow fall" },
  77: { main: "Snow", description: "snow grains" },
  80: { main: "Rain", description: "slight rain showers" },
  81: { main: "Rain", description: "moderate rain showers" },
  82: { main: "Rain", description: "violent rain showers" },
  85: { main: "Snow", description: "slight snow showers" },
  86: { main: "Snow", description: "heavy snow showers" },
  95: { main: "Thunderstorm", description: "thunderstorm" },
  96: { main: "Thunderstorm", description: "thunderstorm with slight hail" },
  99: { main: "Thunderstorm", description: "thunderstorm with heavy hail" },
};

export function codeToCondition(code) {
  return WMO_CODES[code] ?? { main: "Clouds", description: "unknown" };
}

// Maps a weather "main" condition (+ "d"/"n" for day/night) to an MUI icon.
export function getWeatherIcon(main = "", dayNight = "d", props = {}) {
  const isNight = dayNight === "n" || dayNight?.endsWith?.("n");
  const condition = main.toLowerCase();

  if (condition.includes("thunderstorm")) return <ThunderstormRoundedIcon {...props} />;
  if (condition.includes("snow")) return <AcUnitRoundedIcon {...props} />;
  if (condition.includes("rain") || condition.includes("drizzle")) return <GrainRoundedIcon {...props} />;
  if (condition.includes("fog") || condition.includes("mist") || condition.includes("haze"))
    return <FoggyIcon {...props} />;
  if (condition.includes("cloud")) {
    return isNight ? <CloudQueueRoundedIcon {...props} /> : <CloudRoundedIcon {...props} />;
  }
  if (condition.includes("clear")) {
    return isNight ? <NightsStayRoundedIcon {...props} /> : <WbSunnyRoundedIcon {...props} />;
  }
  return <WbSunnyRoundedIcon {...props} />;
}

// Full-page background gradient keyed off the current condition, so the
// whole app visually reacts to the weather that's on screen.
export function getBackgroundGradient(main = "", dayNight = "d") {
  const isNight = dayNight === "n" || dayNight?.endsWith?.("n");
  const condition = main.toLowerCase();

  if (isNight) return "linear-gradient(160deg, #0b1026 0%, #1a1f3d 45%, #2b2f5e 100%)";
  if (condition.includes("thunderstorm")) return "linear-gradient(160deg, #232526 0%, #3a3d5c 60%, #5b3a6e 100%)";
  if (condition.includes("snow")) return "linear-gradient(160deg, #83a4d4 0%, #b6fbff 100%)";
  if (condition.includes("rain") || condition.includes("drizzle")) return "linear-gradient(160deg, #3a6073 0%, #16222a 100%)";
  if (condition.includes("fog") || condition.includes("mist") || condition.includes("haze"))
    return "linear-gradient(160deg, #757f9a 0%, #d7dde8 100%)";
  if (condition.includes("cloud")) return "linear-gradient(160deg, #4b6cb7 0%, #182848 100%)";
  if (condition.includes("clear")) return "linear-gradient(160deg, #2980b9 0%, #6dd5fa 55%, #ffe29f 100%)";
  return "linear-gradient(160deg, #1e3c72 0%, #2a5298 100%)";
}

// Great-circle distance between two lat/lon points, in kilometres.
export function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDayLabel(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) return "Today";
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function formatTime(isoString) {
  if (!isoString) return "--";
  return new Date(isoString).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

// EPA-style breakpoints for the US AQI scale returned by Open-Meteo.
export function aqiCategory(aqi) {
  if (aqi == null) return { label: "--", color: "default" };
  if (aqi <= 50) return { label: "Good", color: "success" };
  if (aqi <= 100) return { label: "Moderate", color: "warning" };
  if (aqi <= 150) return { label: "Unhealthy (sensitive)", color: "warning" };
  if (aqi <= 200) return { label: "Unhealthy", color: "error" };
  if (aqi <= 300) return { label: "Very unhealthy", color: "error" };
  return { label: "Hazardous", color: "error" };
}

// WHO/EPA UV Index scale.
export function uvCategory(uv) {
  if (uv == null) return { label: "--", color: "default" };
  if (uv < 3) return { label: "Low", color: "success" };
  if (uv < 6) return { label: "Moderate", color: "warning" };
  if (uv < 8) return { label: "High", color: "warning" };
  if (uv < 11) return { label: "Very high", color: "error" };
  return { label: "Extreme", color: "error" };
}
