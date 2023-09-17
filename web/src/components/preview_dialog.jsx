import { Button, Card, CircularProgress, Dialog, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { testPlugin } from "../endpoint_manager";

const PreviewDialog = (props) => {
  const { open, plugin, onClose } = props;

  const [image, setImage] = useState(null);

  useEffect(() => {
    const loadImage = async () => {
      setImage(null);
      setImage(await testPlugin(plugin.plugin, plugin));
    };

    if (open && plugin !== null) {
      loadImage();
    }
  }, [open, plugin]);

  console.log(open);

  return (
    <Dialog open={open} onClose={onClose}>
      <Card>
        <Stack gap={2} sx={{ margin: "2rem", marginBottom: "1rem" }}>
          {image === null ? (
            <CircularProgress />
          ) : (
            <>
              <img src={image} alt="Preview" />{" "}
              <Button onClick={onClose}>Close preview</Button>
            </>
          )}
        </Stack>
      </Card>
    </Dialog>
  );
};

export default PreviewDialog;
