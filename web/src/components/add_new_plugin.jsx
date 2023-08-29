import { Button, Dialog, Modal, Stack } from "@mui/material";

const AddNewPlugin = (props) => {
  const { open, onClose, availablePlugins, onAddPlugin } = props;
  return (
    <Dialog open={open} onClose={onClose}>
      <div style={{ padding: "2rem" }}>
        <h2>Available plugins</h2>
        <Stack alignItems="flex-start">
          {availablePlugins.map((item) => {
            return (
              <Button
                variant="text"
                color="primary"
                key={item}
                onClick={() => {
                  onAddPlugin(item);
                }}
              >
                {item}
              </Button>
            );
          })}
        </Stack>
      </div>
    </Dialog>
  );
};

export default AddNewPlugin;
