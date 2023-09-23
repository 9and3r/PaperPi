import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  IconButton,
  InputAdornment,
  Modal,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import BasicDialog from "./basic_dialog";
import PluginItem from "./plugin_item";
import { useEffect, useMemo, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

const AddNewPlugin = (props) => {
  const { open, onClose, availablePlugins, onAddPlugin } = props;
  const [filter, setFilter] = useState("");
  const [errorPluginsOpen, setErrorPluginsOpen] = useState(false);

  // Reset filter when opening dialog
  useEffect(() => {
    if (open) {
      setFilter("");
    }
  }, [open]);

  const filteredPlugins = useMemo(() => {
    if (!availablePlugins) {
      return [];
    }
    if (filter.length === 0) {
      return availablePlugins.loaded;
    }
    return availablePlugins.loaded.filter(
      (item) => item.name.indexOf(filter) >= 0
    );
  }, [availablePlugins, filter]);

  if (availablePlugins === null) {
    return null;
  }

  return (
    <>
      <BasicDialog
        open={errorPluginsOpen}
        onClose={() => setErrorPluginsOpen(false)}
        title="Plugins with errors"
        showAccept={false}
        render={
          <Stack gap={3}>
            {availablePlugins.error.map((item) => (
              <Card key={item.name}>
                <CardHeader title={item.name} />
                <CardContent>
                  <code>{item.error}</code>
                </CardContent>
              </Card>
            ))}
          </Stack>
        }
      />
      <BasicDialog
        open={open}
        onClose={onClose}
        title={
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            gap={5}
          >
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography variant="h5">Available plugins</Typography>
              {availablePlugins.error.length > 0 ? (
                <IconButton onClick={() => setErrorPluginsOpen(true)}>
                  <ErrorOutlineIcon color="error" />
                </IconButton>
              ) : null}
            </Stack>
            <TextField
              label="Search"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        }
        showAccept={false}
        render={
          <Stack alignItems="flex-start" gap={2}>
            {filteredPlugins.map((item) => {
              return (
                <PluginItem
                  plugin={item.name}
                  key={item.name}
                  version={item.version}
                  onClick={() => {
                    onAddPlugin(item.name);
                  }}
                />
              );
            })}
          </Stack>
        }
      />
    </>
  );
};

export default AddNewPlugin;
