import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";

const PluginConfigurator = (props) => {
  const { plugin, pluginKey, updatePluginConfig } = props;
  const [layouts, setLayouts] = useState([]);

  useEffect(() => {
    const loadLayouts = async () => {
      let response = await fetch(
        "http://localhost:4000/endpoints/plugins/" + plugin.plugin + "/layouts"
      );
      let data = await response.json();
      setLayouts(data);
    };
    if (plugin) {
      setLayouts([]);
      loadLayouts();
    }
  }, [plugin]);

  console.log(layouts);

  const setNewValue = (key, value) => {
    let newConfig = { ...plugin };
    newConfig[key] = value;
    updatePluginConfig(pluginKey, newConfig);
  };

  return (
    <Stack gap={3}>
      {Object.entries(plugin)
        .filter(([key, value]) => {
          return key !== "plugin";
        })
        .map(([key, value]) => {
          if (typeof value === "boolean") {
            return (
              <FormControlLabel
                key={key}
                control={
                  <Checkbox
                    checked={value}
                    onChange={(event) => {
                      setNewValue(key, event.target.checked);
                    }}
                  />
                }
                label={key}
              />
            );
          }

          if (key === "layout") {
            return (
              <FormControl fullWidth key={key}>
                <InputLabel>{key}</InputLabel>
                <Select
                  value={layouts.indexOf(value) >= 0 ? value : ""}
                  label={key}
                  onChange={(event) => setNewValue(key, event.target.value)}
                >
                  {layouts.map((item) => {
                    return (
                      <MenuItem key={item} value={item}>
                        {item}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            );
          }

          return (
            <TextField
              key={key}
              label={key}
              value={value}
              onChange={(event) => {
                setNewValue(key, event.target.value);
              }}
            />
          );
        })}
    </Stack>
  );
};
export default PluginConfigurator;
