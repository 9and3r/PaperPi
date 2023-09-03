import { useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import { Card, Dialog, Divider, IconButton, Slide, Stack } from "@mui/material";
import PluginConfigurator from "./plugin_configurator";
import { ReactComponent as Logo } from "../PaperPi.svg";
import {
  getConfig,
  getPluginConfig,
  loadPlugins,
  sendConfig,
} from "../endpoint_manager";
import AddNewPlugin from "./add_new_plugin";
import AddIcon from "@mui/icons-material/Add";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SaveIcon from "@mui/icons-material/Save";
import BasicDialog from "./basic_dialog";
import DeveloperModeIcon from "@mui/icons-material/DeveloperMode";

const Main = () => {
  const [availablePlugins, setAvailablePlugins] = useState(null);
  const [selectedPlugin, setSelectedPlugin] = useState(null);
  const [config, setConfig] = useState(null);
  const [showApplyChangesDialog, setShowApplyChangesDialog] = useState(false);
  const [showJson, setShowJson] = useState(null);

  const [newPluginDialogOpen, setNewPluginDialogOpen] = useState(false);

  useEffect(() => {
    const initialLoad = async () => {
      setAvailablePlugins(await loadPlugins());
      setConfig(await getConfig());
    };
    initialLoad();
    setShowJson(localStorage.getItem("showJson"));
  }, []);

  const onAddPlugin = async (item) => {
    let newConfig = { ...config };
    // Find available name
    let num = 0;
    let humanName = item
      .replace("_", " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    let name = humanName;
    while (name in newConfig.plugins) {
      num++;
      name = humanName + " " + num;
    }

    let pluginConfig = await getPluginConfig(item);
    newConfig.plugins[name] = {};
    Object.entries(pluginConfig.config).forEach(([key, item]) => {
      newConfig.plugins[name][key] = item.value;
    });
    setConfig(newConfig);
    setNewPluginDialogOpen(false);
    setSelectedPlugin(name);
  };

  const updatePluginConfig = (plugin, newPluginConfig) => {
    let newConfig = { ...config };
    newConfig.plugins[plugin] = newPluginConfig;
    setConfig(newConfig);
  };

  const updatePluginKey = (oldKey, newKey) => {
    let newConfig = { ...config };
    newConfig.plugins[newKey] = newConfig.plugins[oldKey];
    delete newConfig.plugins[oldKey];
    setConfig(newConfig);
    if (selectedPlugin === oldKey) {
      setSelectedPlugin(newKey);
    }
  };

  const deletePlugin = (key) => {
    let newConfig = { ...config };
    delete newConfig.plugins[key];
    setConfig(newConfig);
    if (selectedPlugin === key) {
      setSelectedPlugin(null);
    }
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
      <div style={{ margin: "3rem", marginTop: 0 }}>
        <AddNewPlugin
          availablePlugins={availablePlugins}
          open={newPluginDialogOpen}
          onAddPlugin={onAddPlugin}
          onClose={() => {
            setNewPluginDialogOpen(false);
          }}
        />
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <h1>PaperPi</h1>
          <Logo style={{ width: "3rem" }} />
          <Button
            onClick={() => setShowApplyChangesDialog(true)}
            endIcon={<SaveIcon />}
          >
            Apply changes
          </Button>
        </Stack>
        <Stack
          direction="row"
          justifyContent="space-between"
          gap={3}
          alignItems="flex-start"
        >
          <Card sx={{ padding: "1rem", minWidth: "15rem", paddingTop: 0 }}>
            <h3>Main</h3>
            <Button
              onClick={() => setSelectedPlugin(null)}
              variant={selectedPlugin === null ? "contained" : "outlined"}
            >
              General configuration
            </Button>
            <Divider />
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
            <Stack direction="column" gap={3}>
              {config !== null
                ? Object.entries(config.plugins).map(([key, item]) => (
                    <Button
                      key={key}
                      style={{ justifyContent: "space-between" }}
                      variant={
                        selectedPlugin !== null && selectedPlugin === key
                          ? "contained"
                          : "outlined"
                      }
                      endIcon={
                        item.enabled ? null : (
                          <WarningAmberIcon
                            color={
                              selectedPlugin !== null && selectedPlugin === key
                                ? "inherit"
                                : "warning"
                            }
                          />
                        )
                      }
                      onClick={() => {
                        setSelectedPlugin(key);
                      }}
                    >
                      {key}
                    </Button>
                  ))
                : null}
            </Stack>
          </Card>
          <div style={{ flexGrow: 1 }}>
            {selectedPlugin !== null ? (
              <PluginConfigurator
                pluginKey={selectedPlugin}
                plugin={config.plugins[selectedPlugin]}
                pluginKeys={Object.keys(config.plugins)}
                updatePluginConfig={updatePluginConfig}
                updatePluginKey={updatePluginKey}
                onDelete={deletePlugin}
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
      </div>
    </>
  );
};

export default Main;
