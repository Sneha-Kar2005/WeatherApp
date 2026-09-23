// Open-Meteo — free, keyless, CORS-enabled weather stack. Blends ECMWF/GFS/ICON
// models, no API key or account required, no rate-limit secrets to manage on
// a public deploy.
export const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
export const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
export const AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";

export const CURRENT_PARAMS =
  "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_gusts_10m,wind_direction_10m,surface_pressure,uv_index,is_day";
export const HOURLY_PARAMS = "temperature_2m,weather_code,precipitation_probability,visibility";
export const DAILY_PARAMS =
  "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,uv_index_max,sunrise,sunset";

// RainViewer — free, keyless global precipitation radar/satellite tiles.
export const RAINVIEWER_FRAMES_URL = "https://api.rainviewer.com/public/weather-maps.json";

// BigDataCloud — free, keyless reverse geocoding (coords -> place name),
// used to label "use my location" with a real city name instead of a
// generic placeholder.
export const REVERSE_GEOCODE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";

// GDACS (Global Disaster Alert and Coordination System, run by the EU Joint
// Research Centre) publishes real, live tropical-cyclone alerts and official
// JTWC forecast tracks — but sends no CORS headers, so it's proxied:
//  - in dev, by the Vite dev-server proxy (vite.config.js)
//  - in production, by the Vercel serverless functions in /api
export const CYCLONE_LIST_URL = "/api/cyclone";
export const CYCLONE_TRACK_URL = "/api/cyclone-track";

// Distance thresholds (km) used to grade how relevant a cyclone is to the
// currently searched location.
export const CYCLONE_DANGER_KM = 800;
export const CYCLONE_WATCH_KM = 2000;
