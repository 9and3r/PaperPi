import {
  Button,
  Dialog,
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

const AddNewPlugin = (props) => {
  const { open, onClose, availablePlugins, onAddPlugin } = props;
  const [filter, setFilter] = useState("");

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
    <BasicDialog
      open={open}
      onClose={onClose}
      title={
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h5">Available plugins</Typography>
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
  );
};

export default AddNewPlugin;
