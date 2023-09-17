import { useState } from "react";
import Button from "@mui/material/Button";
import {
  Card,
  Collapse,
  IconButton,
  Stack,
  ThemeProvider,
  Typography,
  createTheme,
} from "@mui/material";
import PluginConfigurator from "./plugin_configurator";
import { ReactComponent as Logo } from "../PaperPi.svg";
import { TransitionGroup } from "react-transition-group";

import { getPluginConfig, sendConfig } from "../endpoint_manager";
import AddNewPlugin from "./add_new_plugin";
import AddIcon from "@mui/icons-material/Add";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SaveIcon from "@mui/icons-material/Save";
import BasicDialog from "./basic_dialog";
import DeveloperModeIcon from "@mui/icons-material/DeveloperMode";
import MainConfiguration from "./main_configuration";

const Main = (props) => {
  const { config, availablePlugins, setConfig } = props;

  const [selectedPluginIndex, setSelectedPluginIndex] = useState(null);

  const [showApplyChangesDialog, setShowApplyChangesDialog] = useState(false);

  const [showJson, setShowJson] = useState(
    localStorage.getItem("showJson") === "true"
  );

  const themeLight = createTheme({
    palette: {
      mode: "light",
    },
  });

  const [newPluginDialogOpen, setNewPluginDialogOpen] = useState(false);

  const onAddPlugin = async (item) => {
    let newConfig = { ...config };
    // Find available name
    let humanName = item
      .replace("_", " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    let name = humanName;
    let pluginConfig = await getPluginConfig(item);
    let newPluginConfig = {};
    Object.entries(pluginConfig.config).forEach(([key, item]) => {
      newPluginConfig[key] = item.value;
    });
    newPluginConfig.name = name;
    newConfig.plugins.push(newPluginConfig);
    setConfig(newConfig);
    setNewPluginDialogOpen(false);
    setSelectedPluginIndex(newConfig.plugins.length - 1);
  };

  const updatePluginConfig = (plugin, newPluginConfig) => {
    let newConfig = { ...config };
    newConfig.plugins[plugin] = newPluginConfig;
    setConfig(newConfig);
  };

  const updateMainConfig = (key, value) => {
    let newConfig = { ...config };
    newConfig.main[key] = value;
    setConfig(newConfig);
  };

  const deletePlugin = (key) => {
    let newConfig = { ...config };
    delete newConfig.plugins[key];
    setConfig(newConfig);

    setSelectedPluginIndex(null);
  };

  return (
    <>
      <IconButton
        sx={{
          zIndex: 1000,
          position: "fixed",
          bottom: "0.5rem",
          right: "0.5rem",
        }}
        onClick={() => {
          localStorage.setItem("showJson", !showJson);
          setShowJson(!showJson);
        }}
      >
        <DeveloperModeIcon />
      </IconButton>
      <BasicDialog
        open={showApplyChangesDialog}
        title="Apply changes?"
        onClose={() => setShowApplyChangesDialog(false)}
        render={
          "Are you sure you want to apply the changes? Your current configuration will be overwriten"
        }
        onAccept={async () => {
          await sendConfig(config);
          setShowApplyChangesDialog(false);
        }}
        acceptButtonLabel="Apply changes"
      />
      <Stack>
        <AddNewPlugin
          availablePlugins={availablePlugins}
          open={newPluginDialogOpen}
          onAddPlugin={onAddPlugin}
          onClose={() => {
            setNewPluginDialogOpen(false);
          }}
        />
        <ThemeProvider theme={themeLight}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{
              position: "sticky",
              zIndex: 5,
              backgroundColor: "#FFFFFFFF",
              color: "black",
              padding: "0 3rem",
              top: 0,
              left: 0,
              right: 0,
            }}
          >
            <Stack direction="row" alignItems="center" gap={3}>
              <Logo style={{ width: "3rem" }} />
              <Typography variant="h4" sx={{ margin: "0.7rem 0" }}>
                PaperPi
              </Typography>
            </Stack>

            <Button
              onClick={() => setShowApplyChangesDialog(true)}
              endIcon={<SaveIcon />}
              color="warning"
              variant="outlined"
            >
              Apply changes
            </Button>
          </Stack>
        </ThemeProvider>

        <Stack
          direction="row"
          justifyContent="space-between"
          gap={3}
          sx={{ margin: "3rem 3rem" }}
          alignItems="flex-start"
        >
          <Card sx={{ padding: "1rem", minWidth: "15rem", paddingTop: 0 }}>
            <h3>Main</h3>
            <Button
              sx={{ width: "100%", justifyContent: "space-between" }}
              onClick={() => setSelectedPluginIndex(null)}
              variant={selectedPluginIndex === null ? "contained" : "outlined"}
            >
              Configuration
            </Button>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <h3>Plugins</h3>
              <IconButton
                aria-label="Add plugin"
                onClick={() => {
                  setNewPluginDialogOpen(true);
                }}
              >
                <AddIcon />
              </IconButton>
            </Stack>
            <TransitionGroup>
              {config !== null
                ? config.plugins.map((item, index) => (
                    <Collapse key={index} sx={{ marginBottom: "1rem" }}>
                      <Button
                        style={{
                          width: "100%",
                          justifyContent: "space-between",
                        }}
                        variant={
                          selectedPluginIndex !== null &&
                          selectedPluginIndex === index
                            ? "contained"
                            : "outlined"
                        }
                        endIcon={
                          item.enabled ? null : (
                            <WarningAmberIcon
                              color={
                                selectedPluginIndex !== null &&
                                selectedPluginIndex === index
                                  ? "inherit"
                                  : "warning"
                              }
                            />
                          )
                        }
                        onClick={() => {
                          setSelectedPluginIndex(index);
                        }}
                      >
                        {item.name}
                      </Button>
                    </Collapse>
                  ))
                : null}
            </TransitionGroup>
          </Card>
          <div style={{ flexGrow: 1 }}>
            {selectedPluginIndex !== null ? (
              <PluginConfigurator
                index={selectedPluginIndex}
                plugin={config.plugins[selectedPluginIndex]}
                updatePluginConfig={updatePluginConfig}
                onDelete={deletePlugin}
              />
            ) : config != null && config.main ? (
              <MainConfiguration
                config={config.main}
                onConfigChange={updateMainConfig}
              />
            ) : null}
          </div>
          {showJson ? (
            <textarea
              style={{ width: "40%", height: "50vh" }}
              value={JSON.stringify(config, null, 2)}
              readOnly={true}
            />
          ) : null}
        </Stack>
      </Stack>
    </>
  );
};

export default Main;
