import logo from "./logo.svg";
import "./App.css";
import { Button, Stack, ThemeProvider, createTheme } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";

function App() {
  const theme = createTheme({
    palette: {
      mode: "dark",
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme={true}></CssBaseline>
    </ThemeProvider>
  );
}

export default App;
