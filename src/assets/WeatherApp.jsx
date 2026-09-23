import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

import AirRoundedIcon from "@mui/icons-material/AirRounded";
import WbSunnyRoundedIcon from "@mui/icons-material/WbSunnyRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CycloneRoundedIcon from "@mui/icons-material/CycloneRounded";

import SearchBox from "./SearchBox";
import CurrentWeather from "./CurrentWeather";
import Forecast from "./Forecast";
import HourlyChart from "./HourlyChart";
import CycloneWatch from "./CycloneWatch";
import WeatherMap from "./WeatherMap";

import { FORECAST_URL, AIR_QUALITY_URL, CURRENT_PARAMS, HOURLY_PARAMS, DAILY_PARAMS } from "./config";
import { getBackgroundGradient, codeToCondition } from "./weatherUtils";

const DEFAULT_LOCATION = { lat: 22.5726, lon: 88.3639, label: "Kolkata, West Bengal, India" };

export default function WeatherApp() {
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [current, setCurrent] = useState(null);
  const [hourly, setHourly] = useState(null);
  const [daily, setDaily] = useState(null);
  const [airQuality, setAirQuality] = useState(null);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const forecastUrl =
          `${FORECAST_URL}?latitude=${location.lat}&longitude=${location.lon}` +
          `&current=${CURRENT_PARAMS}&hourly=${HOURLY_PARAMS}&daily=${DAILY_PARAMS}` +
          `&timezone=auto&forecast_days=16`;
        const aqUrl = `${AIR_QUALITY_URL}?latitude=${location.lat}&longitude=${location.lon}&current=us_aqi,pm2_5,pm10`;

        const [weatherRes, aqRes] = await Promise.all([fetch(forecastUrl), fetch(aqUrl)]);
        if (!weatherRes.ok) throw new Error("Unable to fetch weather data");

        const weatherJson = await weatherRes.json();
        const aqJson = aqRes.ok ? await aqRes.json() : null;

        if (cancelled) return;

        const { main, description } = codeToCondition(weatherJson.current.weather_code);
        const dayNight = weatherJson.current.is_day ? "d" : "n";
        const currentHourIdx = Math.max(
          0,
          weatherJson.hourly.time.findIndex((t) => new Date(t).getTime() >= new Date(weatherJson.current.time).getTime())
        );

        setCurrent({
          city: location.label,
          temp: weatherJson.current.temperature_2m,
          feelslike: weatherJson.current.apparent_temperature,
          humidity: weatherJson.current.relative_humidity_2m,
          pressure: weatherJson.current.surface_pressure,
          windSpeed: weatherJson.current.wind_speed_10m,
          windGusts: weatherJson.current.wind_gusts_10m,
          uvIndex: weatherJson.current.uv_index,
          tempMax: weatherJson.daily.temperature_2m_max[0],
          tempMin: weatherJson.daily.temperature_2m_min[0],
          sunrise: weatherJson.daily.sunrise[0],
          sunset: weatherJson.daily.sunset[0],
          visibility: weatherJson.hourly.visibility?.[currentHourIdx],
          main,
          description,
          dayNight,
        });

        setHourly(weatherJson.hourly);
        setDaily(weatherJson.daily);

        if (aqJson?.current) {
          setAirQuality({
            usAqi: aqJson.current.us_aqi,
            pm2_5: aqJson.current.pm2_5,
            pm10: aqJson.current.pm10,
          });
        } else {
          setAirQuality(null);
        }
      } catch {
        if (!cancelled) setErrorMsg("Couldn't load weather for that location. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location]);

  const background = current ? getBackgroundGradient(current.main, current.dayNight) : getBackgroundGradient();

  return (
    <Box className="app-background" sx={{ background }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: "rgba(15, 18, 38, 0.55)", backdropFilter: "blur(12px)" }}>
        <Toolbar>
          <CycloneRoundedIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Skyline
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            Weather &amp; Cyclone Forecasting
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ pt: 4 }}>
        <Stack spacing={3}>
          <SearchBox onSelectLocation={setLocation} />

          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            textColor="inherit"
            variant="scrollable"
            scrollButtons="auto"
            slotProps={{ indicator: { style: { backgroundColor: "#6dd5fa" } } }}
          >
            <Tab icon={<WbSunnyRoundedIcon />} iconPosition="start" label="Current" />
            <Tab icon={<CalendarMonthRoundedIcon />} iconPosition="start" label="Forecast" />
            <Tab icon={<CycloneRoundedIcon />} iconPosition="start" label="Cyclone Watch" />
          </Tabs>

          {loading ? (
            <Stack sx={{ alignItems: "center", py: 6 }}>
              <CircularProgress />
            </Stack>
          ) : (
            <>
              {tab === 0 && (
                <Stack spacing={3}>
                  <CurrentWeather info={current} airQuality={airQuality} />
                  <WeatherMap center={location} label={location.label} />
                </Stack>
              )}
              {tab === 1 && (
                <Stack spacing={3}>
                  <HourlyChart hourly={hourly} />
                  <Forecast daily={daily} />
                </Stack>
              )}
              {tab === 2 && <CycloneWatch coords={location} cityLabel={current?.city ?? location.label} />}
            </>
          )}

          <Stack direction="row" spacing={1} sx={{ opacity: 0.5, pt: 2, justifyContent: "center" }}>
            <AirRoundedIcon fontSize="small" />
            <Typography variant="caption">
              Weather &amp; air quality by Open-Meteo &middot; Cyclone tracks by GDACS
            </Typography>
          </Stack>
        </Stack>
      </Container>

      <Snackbar
        open={Boolean(errorMsg)}
        autoHideDuration={5000}
        onClose={() => setErrorMsg("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setErrorMsg("")} sx={{ width: "100%" }}>
          {errorMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
