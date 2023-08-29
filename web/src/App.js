import "./App.css";
import { Button, Stack, ThemeProvider, createTheme } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import Main from "./components/main";

function App() {
  const theme = createTheme({
    palette: {
      mode: "dark",
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme={true}></CssBaseline>
      <Main />
    </ThemeProvider>
  );
}

export default App;
