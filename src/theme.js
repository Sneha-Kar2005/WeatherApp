import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#6dd5fa" },
    secondary: { main: "#ffb86c" },
    error: { main: "#ff6b6b" },
    warning: { main: "#ffb020" },
    success: { main: "#4ade80" },
    background: {
      default: "#0f1226",
      paper: "rgba(255, 255, 255, 0.06)",
    },
  },
  shape: { borderRadius: 18 },
  typography: {
    fontFamily: '"Poppins", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(18px)",
          backgroundColor: "rgba(255, 255, 255, 0.08)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 14,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
});

export default theme;
