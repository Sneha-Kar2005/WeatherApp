import { useEffect, useMemo, useRef, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import MyLocationRoundedIcon from "@mui/icons-material/MyLocationRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";

import { GEOCODE_URL, REVERSE_GEOCODE_URL } from "./config";

function formatOptionLabel(option) {
  return [option.name, option.admin1, option.country].filter(Boolean).join(", ");
}

async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(`${REVERSE_GEOCODE_URL}?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    if (!res.ok) return null;
    const data = await res.json();
    const label = [data.city || data.locality, data.principalSubdivision, data.countryName]
      .filter(Boolean)
      .join(", ");
    return label || null;
  } catch {
    return null;
  }
}

export default function SearchBox({ onSelectLocation }) {
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (!inputValue || inputValue.length < 2) {
        setOptions([]);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(
          `${GEOCODE_URL}?name=${encodeURIComponent(inputValue)}&count=5&language=en&format=json`
        );
        const data = await res.json();
        setOptions(Array.isArray(data.results) ? data.results : []);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [inputValue]);

  const optionsWithLabel = useMemo(
    () => options.map((o) => ({ ...o, label: formatOptionLabel(o) })),
    [options]
  );

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const label = (await reverseGeocode(lat, lon)) ?? "My Location";
        setLocating(false);
        onSelectLocation({ lat, lon, label });
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  };

  return (
    <Stack direction="row" spacing={1.5} sx={{ width: "100%", alignItems: "center" }}>
      <Autocomplete
        fullWidth
        filterOptions={(x) => x}
        options={optionsWithLabel}
        loading={loading}
        inputValue={inputValue}
        onInputChange={(_, value) => setInputValue(value)}
        isOptionEqualToValue={(opt, val) => opt.id === val.id}
        getOptionLabel={(opt) => opt.label ?? ""}
        onChange={(_, selected) => {
          if (!selected) return;
          onSelectLocation({
            lat: selected.latitude,
            lon: selected.longitude,
            label: formatOptionLabel(selected),
            timezone: selected.timezone,
          });
          setInputValue("");
          setOptions([]);
        }}
        renderOption={(props, option) => (
          <li {...props} key={option.id}>
            <LocationOnRoundedIcon fontSize="small" sx={{ mr: 1, opacity: 0.6 }} />
            {option.label}
          </li>
        )}
        renderInput={({ slotProps, ...params }) => (
          <TextField
            {...params}
            label="Search for a city"
            placeholder="e.g. Kolkata, West Bengal"
            variant="filled"
            slotProps={{
              ...slotProps,
              input: {
                ...slotProps.input,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={18} /> : null}
                    {slotProps.input.endAdornment}
                  </>
                ),
              },
            }}
          />
        )}
      />

      <Tooltip title="Use my current location">
        <span>
          <IconButton
            color="primary"
            onClick={handleUseMyLocation}
            disabled={locating}
            sx={{
              bgcolor: "rgba(255,255,255,0.08)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.16)" },
            }}
          >
            {locating ? <CircularProgress size={20} /> : <MyLocationRoundedIcon />}
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}
