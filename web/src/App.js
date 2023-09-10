import "./App.css";
import { Fade, Slide, ThemeProvider, createTheme } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import Main from "./components/main";
import Welcome from "./components/welcome";
import { useEffect, useState } from "react";
import zIndex from "@mui/material/styles/zIndex";

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
      //primary: primary,
    },
  });

  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let interval = setTimeout(() => {
      setLoaded(true);
    }, 1500);
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme={true}></CssBaseline>
      <Slide in={!loaded} direction="left" appear={false}>
        <div
          style={{
            position: "absolute",
            zIndex: 100,
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
          }}
        >
          <Welcome />
        </div>
      </Slide>
      <Main />
    </ThemeProvider>
  );
}

export default App;
