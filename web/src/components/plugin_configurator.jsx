import {
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  IconButton,
  Stack,
} from "@mui/material";
import { useEffect, useState } from "react";
import { getPluginConfig, sendConfig, testPlugin } from "../endpoint_manager";
import EditIcon from "@mui/icons-material/Edit";
import ChangePluginName from "./change_plugin_name";
import DeleteIcon from "@mui/icons-material/Delete";
import BasicDialog from "./basic_dialog";
import DynamicOption from "./dynamic_option";

const PluginConfigurator = (props) => {
  const {
    plugin,
    pluginKey,
    updatePluginConfig,
    pluginKeys,
    updatePluginKey,
    onDelete,
  } = props;

  const [pluginConfig, setPluginConfig] = useState(null);
  const [orderedOptions, setOrderedOptions] = useState([]);
  const [nameEditDialogOpen, setNameEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [image, setImage] = useState(null);

  const pluginName = plugin ? plugin.plugin : null;

  useEffect(() => {
    const loadPluginConfig = async () => {
      let response = await getPluginConfig(pluginName);
      setPluginConfig(response);
      let ordered = Object.entries(response.config).sort((a1, a2) => {
        let a1SystemPriority = "system_required" in a1[1] && a1[1] ? -1 : 1;
        let a2SystemPriority = "system_required" in a2[1] && a2[1] ? -1 : 1;
        if (a1SystemPriority === a2SystemPriority) {
          return a1[0].localeCompare(a2[0]);
        }
        return a1SystemPriority - a2SystemPriority;
      });
      setOrderedOptions(ordered);
    };
    if (pluginName) {
      setPluginConfig([]);
      setOrderedOptions([]);
      loadPluginConfig();
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

      <Card
        sx={{
          padding: "1rem",
          paddingTop: 0,
        }}
      >
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
          <Button
            onClick={async () => {
              setImage(-1);
              setImage(await testPlugin(plugin.plugin, plugin));
            }}
          >
            Preview
          </Button>
        </Stack>
        <Stack gap={3}>
          {pluginConfig && plugin && pluginConfig.config
            ? orderedOptions.map(([key, value]) => {
                return (
                  <DynamicOption
                    key={key}
                    value={plugin[key]}
                    disabled={key === "plugin"}
                    option={value}
                    label={key}
                    onChange={(newValue) => {
                      setNewValue(key, newValue);
                    }}
                  />
                );
              })
            : null}
        </Stack>
      </Card>
      {image ? (
        <Dialog open={true} onClose={() => setImage(null)}>
          <Card>
            <Stack gap={2} sx={{ margin: "2rem", marginBottom: "1rem" }}>
              {image === -1 ? (
                <CircularProgress />
              ) : (
                <>
                  <img src={image} alt="Preview" />{" "}
                  <Button onClick={() => setImage(null)}>Close preview</Button>
                </>
              )}
            </Stack>
          </Card>
        </Dialog>
      ) : null}
    </>
  );
};
export default PluginConfigurator;
