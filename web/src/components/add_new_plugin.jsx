import { Button, Dialog, Modal, Stack } from "@mui/material";
import BasicDialog from "./basic_dialog";

const AddNewPlugin = (props) => {
  const { open, onClose, availablePlugins, onAddPlugin } = props;
  if (availablePlugins === null) {
    return null;
  }
  return (
    <BasicDialog
      open={open}
      onClose={onClose}
      title="Available plugins"
      showAccept={false}
      render={
        <Stack alignItems="flex-start">
          {availablePlugins.loaded.map((item) => {
            return (
              <Button
                variant="text"
                color="primary"
                key={item.name}
                onClick={() => {
                  onAddPlugin(item.name);
                }}
              >
                {item.name + " (" + item.version + ")"}
              </Button>
            );
          })}
        </Stack>
      }
    />
  );
};

export default AddNewPlugin;
