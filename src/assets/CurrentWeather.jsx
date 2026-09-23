import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";

import WaterDropRoundedIcon from "@mui/icons-material/WaterDropRounded";
import AirRoundedIcon from "@mui/icons-material/AirRounded";
import CompressRoundedIcon from "@mui/icons-material/CompressRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import WbTwilightRoundedIcon from "@mui/icons-material/WbTwilightRounded";
import NightlightRoundedIcon from "@mui/icons-material/NightlightRounded";
import ThermostatRoundedIcon from "@mui/icons-material/ThermostatRounded";
import Co2RoundedIcon from "@mui/icons-material/Co2Rounded";
import Brightness5RoundedIcon from "@mui/icons-material/Brightness5Rounded";

import { getWeatherIcon, formatTime, aqiCategory, uvCategory } from "./weatherUtils";

const STAT_COLORS = {
  success: "#4ade80",
  warning: "#ffb020",
  error: "#ff6b6b",
};

export default function CurrentWeather({ info, airQuality }) {
  if (!info) return null;

  const stat = (icon, label, value, subValue, valueColor) => (
    <Stack spacing={0.5} sx={{ minWidth: 84, alignItems: "center" }}>
      {icon}
      <Typography variant="body2" sx={{ opacity: 0.75 }}>
        {label}
      </Typography>
      <Typography variant="subtitle2" fontWeight={700} sx={{ color: valueColor }}>
        {value}
      </Typography>
      {subValue && (
        <Typography variant="caption" sx={{ opacity: 0.6 }}>
          {subValue}
        </Typography>
      )}
    </Stack>
  );

  const aqi = aqiCategory(airQuality?.usAqi);
  const uv = uvCategory(info.uvIndex);

  return (
    <Card className="fade-in" sx={{ maxWidth: 560, mx: "auto", p: 1 }}>
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <Stack>
            <Typography variant="h5" fontWeight={700}>
              {info.city}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.75, textTransform: "capitalize" }}>
              {info.description}
            </Typography>
          </Stack>
          {getWeatherIcon(info.main, info.dayNight, { sx: { fontSize: 56, opacity: 0.9 } })}
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: "baseline" }}>
          <Typography variant="h2" fontWeight={700}>
            {Math.round(info.temp)}&deg;
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.7 }}>
            C
          </Typography>
          <Chip
            size="small"
            icon={<ThermostatRoundedIcon />}
            label={`Feels like ${Math.round(info.feelslike)}°C`}
            sx={{ ml: 1, bgcolor: "rgba(255,255,255,0.1)" }}
          />
        </Stack>

        <Typography variant="body2" sx={{ opacity: 0.7, mt: 0.5 }}>
          Today&rsquo;s H: {Math.round(info.tempMax)}&deg; &nbsp;L: {Math.round(info.tempMin)}&deg;
        </Typography>

        <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.12)" }} />

        <Stack direction="row" sx={{ flexWrap: "wrap", rowGap: 2, justifyContent: "space-between" }}>
          {stat(<WaterDropRoundedIcon />, "Humidity", `${info.humidity}%`)}
          {stat(
            <AirRoundedIcon />,
            "Wind",
            `${Math.round(info.windSpeed ?? 0)} km/h`,
            info.windGusts ? `gusts ${Math.round(info.windGusts)}` : null
          )}
          {stat(<CompressRoundedIcon />, "Pressure", `${Math.round(info.pressure ?? 0)} hPa`)}
          {stat(<VisibilityRoundedIcon />, "Visibility", `${info.visibility ? (info.visibility / 1000).toFixed(1) : "--"} km`)}
          {stat(
            <Brightness5RoundedIcon />,
            "UV Index",
            info.uvIndex != null ? Math.round(info.uvIndex * 10) / 10 : "--",
            uv.label,
            STAT_COLORS[uv.color]
          )}
        </Stack>

        <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.12)" }} />

        <Stack direction="row" sx={{ justifyContent: "space-around" }}>
          {stat(<WbTwilightRoundedIcon />, "Sunrise", formatTime(info.sunrise))}
          {stat(<NightlightRoundedIcon />, "Sunset", formatTime(info.sunset))}
        </Stack>

        {airQuality && (
          <>
            <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.12)" }} />
            <Stack
              direction="row"
              sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", rowGap: 1 }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Co2RoundedIcon sx={{ opacity: 0.75 }} />
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  Air Quality (US AQI {Math.round(airQuality.usAqi)})
                </Typography>
              </Stack>
              <Chip size="small" color={aqi.color} label={aqi.label} />
            </Stack>
            <Typography variant="caption" sx={{ opacity: 0.6 }}>
              PM2.5: {airQuality.pm2_5?.toFixed(1)} &micro;g/m&sup3; &middot; PM10: {airQuality.pm10?.toFixed(1)} &micro;g/m&sup3;
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
}
