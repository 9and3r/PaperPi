import "./App.css";
import { Slide, ThemeProvider, createTheme } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import Main from "./components/main";
import Welcome from "./components/welcome";
import { useEffect, useState } from "react";
import { getConfig, loadPlugins } from "./endpoint_manager";

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

  const [config, setConfig] = useState(null);
  const [availablePlugins, setAvailablePlugins] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  const MIN_LOAD_TIME_MS = 700;

  useEffect(() => {
    const initialLoad = async () => {
      try {
        const startTime = new Date().getTime();
        setAvailablePlugins(await loadPlugins());
        setConfig(await getConfig());
        const loadTime = new Date().getTime() - startTime;
        if (loadTime > MIN_LOAD_TIME_MS) {
          setLoaded(true);
        } else {
          await new Promise((resolve) =>
            setTimeout(resolve, MIN_LOAD_TIME_MS - loadTime)
          );
          setLoaded(true);
        }
      } catch (error) {
        console.log(error);
        setError(error);
      }
    };
    initialLoad();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme={true}></CssBaseline>
      <Slide in={!loaded} direction="right" appear={false} unmountOnExit>
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
          <Welcome loading={loaded} error={error} />
        </div>
      </Slide>
      {loaded ? (
        <Main
          config={config}
          availablePlugins={availablePlugins}
          setConfig={setConfig}
        />
      ) : null}
    </ThemeProvider>
  );
}

export default App;
