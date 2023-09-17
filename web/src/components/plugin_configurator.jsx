import {
  Button,
  Card,
  CircularProgress,
  Dialog,
  Divider,
  Stack,
} from "@mui/material";
import { useEffect, useState } from "react";
import { getPluginConfig, testPlugin } from "../endpoint_manager";
import DeleteIcon from "@mui/icons-material/Delete";
import BasicDialog from "./basic_dialog";
import DynamicOption from "./dynamic_option";
import VisibilityIcon from "@mui/icons-material/Visibility";

const PluginConfigurator = (props) => {
  const { plugin, index, updatePluginConfig, onDelete } = props;

  const [pluginConfig, setPluginConfig] = useState(null);
  const [orderedOptions, setOrderedOptions] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [image, setImage] = useState(null);

  const name = plugin ? plugin.name : "";
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
    updatePluginConfig(index, newConfig);
  };

  return (
    <>
      <BasicDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
        }}
        title={"Delete " + name}
        render={"Do you want to delete " + name + "?"}
        acceptButtonLabel="Delete"
        onAccept={() => {
          onDelete(index);
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
          <h2>
            {name}
            {}
          </h2>

          <Button
            variant="outlined"
            endIcon={<VisibilityIcon />}
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
        <Divider sx={{ margin: "1rem 0" }} />
        <Stack direction="row-reverse">
          <Button
            variant="outlined"
            color="error"
            endIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete
          </Button>
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
