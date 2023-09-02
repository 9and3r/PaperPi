import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import { Card, Divider, IconButton, Stack } from "@mui/material";
import PluginConfigurator from "./plugin_configurator";
import { getConfig, loadPlugins, sendConfig } from "../endpoint_manager";
import AddNewPlugin from "./add_new_plugin";
import AddIcon from "@mui/icons-material/Add";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SaveIcon from "@mui/icons-material/Save";
import BasicDialog from "./basic_dialog";

const Main = () => {
  const [availablePlugins, setAvailablePlugins] = useState(null);
  const [selectedPlugin, setSelectedPlugin] = useState(null);
  const [config, setConfig] = useState(null);
  const [showApplyChangesDialog, setShowApplyChangesDialog] = useState(false);

  const [newPluginDialogOpen, setNewPluginDialogOpen] = useState(false);

  useEffect(() => {
    const initialLoad = async () => {
      setAvailablePlugins(await loadPlugins());
      setConfig(await getConfig());
    };
    initialLoad();
  }, []);

  const onAddPlugin = (item) => {
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

    newConfig.plugins[name] = {
      plugin: item,
      enabled: true,
      layout: "layout",
      refresh_rate: 30,
      min_display_time: 60,
      max_priority: 2000,
    };
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
      <div style={{ margin: "3rem" }}>
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
          <Button
            onClick={() => setShowApplyChangesDialog(true)}
            endIcon={<SaveIcon />}
          >
            Apply changes
          </Button>
        </Stack>
        <Stack direction="row" justifyContent="space-between" gap={3}>
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
          <textarea
            style={{ width: "40%", height: "50vh" }}
            value={JSON.stringify(config, null, 2)}
            readOnly={true}
          />
        </Stack>
      </div>
    </>
  );
};

export default Main;
