import "./App.css";
import { ThemeProvider, createTheme } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import Main from "./components/main";

function App() {
  const primary = {
    main: "#FFFFFF",
    light: "#000000",
    dark: "#FFFFFF",
    contrastText: "#000000",
  };

  const theme = createTheme({
    palette: {
      mode: "dark",
      primary: primary,
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
