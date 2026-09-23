import { useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import WaterDropRoundedIcon from "@mui/icons-material/WaterDropRounded";
import Brightness5RoundedIcon from "@mui/icons-material/Brightness5Rounded";

import { getWeatherIcon, formatDayLabel, codeToCondition, uvCategory } from "./weatherUtils";

const STAT_COLORS = {
  success: "#4ade80",
  warning: "#ffb020",
  error: "#ff6b6b",
};

export default function Forecast({ daily }) {
  const [range, setRange] = useState(7);

  if (!daily || !daily.time || daily.time.length === 0) return null;

  const days = daily.time.slice(0, range).map((date, i) => {
    const { main, description } = codeToCondition(daily.weather_code[i]);
    return {
      date,
      main,
      description,
      tempMax: daily.temperature_2m_max[i],
      tempMin: daily.temperature_2m_min[i],
      pop: daily.precipitation_probability_max?.[i],
      windMax: daily.wind_speed_10m_max?.[i],
      uvMax: daily.uv_index_max?.[i],
    };
  });

  return (
    <Stack spacing={2} className="fade-in" sx={{ alignItems: "center" }}>
      <ToggleButtonGroup
        size="small"
        value={range}
        exclusive
        onChange={(_, v) => v && setRange(v)}
        sx={{
          "& .MuiToggleButton-root": {
            color: "rgba(255,255,255,0.7)",
            textTransform: "none",
            px: 2,
          },
          "& .Mui-selected": {
            bgcolor: "rgba(109,213,250,0.2) !important",
            color: "#6dd5fa !important",
          },
        }}
      >
        <ToggleButton value={7}>7-day</ToggleButton>
        <ToggleButton value={16}>16-day outlook</ToggleButton>
      </ToggleButtonGroup>

      <Stack
        direction="row"
        spacing={2}
        sx={{
          overflowX: "auto",
          py: 1,
          px: 1,
          maxWidth: 760,
          width: "100%",
        }}
      >
        {days.map((day) => (
          <Card key={day.date} sx={{ minWidth: 140, flexShrink: 0 }}>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="subtitle2" fontWeight={700}>
                {formatDayLabel(day.date)}
              </Typography>

              <Stack sx={{ my: 1, alignItems: "center" }}>
                {getWeatherIcon(day.main, "d", { sx: { fontSize: 36 } })}
              </Stack>

              <Typography variant="body2" sx={{ textTransform: "capitalize", opacity: 0.75, minHeight: 36 }}>
                {day.description}
              </Typography>

              <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 0.5 }}>
                {Math.round(day.tempMax)}&deg; / {Math.round(day.tempMin)}&deg;
              </Typography>

              <Stack direction="row" spacing={0.5} sx={{ mt: 1, justifyContent: "center", flexWrap: "wrap" }}>
                {typeof day.pop === "number" && day.pop > 0 && (
                  <Chip
                    size="small"
                    icon={<WaterDropRoundedIcon />}
                    label={`${Math.round(day.pop)}%`}
                    sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
                  />
                )}
                {typeof day.uvMax === "number" && (
                  <Chip
                    size="small"
                    icon={<Brightness5RoundedIcon sx={{ color: `${STAT_COLORS[uvCategory(day.uvMax).color]} !important` }} />}
                    label={`UV ${Math.round(day.uvMax)}`}
                    sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
                  />
                )}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}
