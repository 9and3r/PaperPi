import {
  Button,
  Card,
  Checkbox,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { getLayouts } from "../endpoint_manager";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import EditIcon from "@mui/icons-material/Edit";
import ChangePluginName from "./change_plugin_name";
import DeleteIcon from "@mui/icons-material/Delete";
import BasicDialog from "./basic_dialog";

const PluginConfigurator = (props) => {
  const {
    plugin,
    pluginKey,
    updatePluginConfig,
    pluginKeys,
    updatePluginKey,
    onDelete,
  } = props;
  const [layouts, setLayouts] = useState([]);
  const [nameEditDialogOpen, setNameEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const pluginName = plugin ? plugin.plugin : null;

  useEffect(() => {
    const loadLayouts = async () => {
      setLayouts(await getLayouts(pluginName));
    };
    if (pluginName) {
      setLayouts([]);
      loadLayouts();
    }
  }, [pluginName]);

  const setNewValue = (key, value) => {
    let newConfig = { ...plugin };
    newConfig[key] = value;
    updatePluginConfig(pluginKey, newConfig);
  };

  return (
    <>
      <BasicDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
        }}
        title={"Delete " + pluginKey}
        render={"Do you want to delete " + pluginKey + "?"}
        acceptButtonLabel="Delete"
        onAccept={() => {
          onDelete(pluginKey);
        }}
      />
      <ChangePluginName
        open={nameEditDialogOpen}
        onClose={() => {
          setNameEditDialogOpen(false);
        }}
        names={pluginKeys}
        initialName={pluginKey}
        onNameChange={(oldKey, newKey) => {
          setNameEditDialogOpen(false);
          updatePluginKey(oldKey, newKey);
        }}
      />
      <Card sx={{ padding: "1rem" }}>
        <Stack
          direction="row"
          gap={1}
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" gap={1} alignItems="center">
            <h2>
              {pluginKey}
              {}
            </h2>
            <IconButton
              onClick={() => {
                setNameEditDialogOpen(true);
              }}
            >
              <EditIcon />
            </IconButton>
          </Stack>
          <Button
            endIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete
          </Button>
        </Stack>
        <Stack gap={3}>
          {plugin
            ? Object.entries(plugin).map(([key, value]) => {
                if (key === "enabled") {
                  return (
                    <Stack direction="row" alignItems="center" key={key}>
                      <FormControlLabel
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
                      {value ? null : (
                        <Tooltip title="This plugin is not enabled">
                          <WarningAmberIcon color="warning" />
                        </Tooltip>
                      )}
                    </Stack>
                  );
                }

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
                        onChange={(event) =>
                          setNewValue(key, event.target.value)
                        }
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
                    disabled={key === "plugin"}
                    onChange={(event) => {
                      setNewValue(key, event.target.value);
                    }}
                  />
                );
              })
            : null}
        </Stack>
      </Card>
    </>
  );
};
export default PluginConfigurator;
