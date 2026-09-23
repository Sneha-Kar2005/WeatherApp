import "./App.css";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import WeatherApp from "./assets/WeatherApp";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <WeatherApp />
    </ThemeProvider>
  );
}

export default App;















