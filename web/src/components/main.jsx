import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import { Stack } from "@mui/material";
import PluginConfigurator from "./plugin_configurator";
import { getConfig, loadPlugins } from "../endpoint_manager";
import AddNewPlugin from "./add_new_plugin";

const Main = () => {
  const [availablePlugins, setAvailablePlugins] = useState([]);
  const [selectedPlugin, setSelectedPlugin] = useState(null);
  const [config, setConfig] = useState(null);

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
    let name = item;
    while (name in newConfig.plugins) {
      num++;
      name = item + "_" + num;
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
    console.log(newPluginConfig);
    setConfig(newConfig);
  };

  return (
    <div style={{ margin: "3rem" }}>
      <AddNewPlugin
        availablePlugins={availablePlugins}
        open={newPluginDialogOpen}
        onAddPlugin={onAddPlugin}
        onClose={() => {
          setNewPluginDialogOpen(false);
        }}
      />
      <h1>PaperPi</h1>
      <Stack direction="row" justifyContent="space-between" gap={3}>
        <Stack direction="column">
          <Button
            onClick={() => {
              setNewPluginDialogOpen(true);
            }}
          >
            Add new Plugin
          </Button>
          {config !== null
            ? Object.entries(config.plugins).map(([key, item]) => (
                <Button
                  key={key}
                  variant={
                    selectedPlugin !== null && selectedPlugin === key
                      ? "outlined"
                      : "text"
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
        {selectedPlugin !== null ? (
          <PluginConfigurator
            pluginKey={selectedPlugin}
            plugin={config.plugins[selectedPlugin]}
            updatePluginConfig={updatePluginConfig}
          />
        ) : null}
        <textarea
          style={{ width: "40%", height: "50vh" }}
          value={JSON.stringify(config, null, 2)}
          readOnly={true}
        />
      </Stack>
    </div>
  );
};

export default Main;
