import { Button, Card, CircularProgress, Dialog, Stack } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { testPlugin } from "../endpoint_manager";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

const PluginPreview = (props) => {
  const { plugin } = props;

  const [image, setImage] = useState(null);

  useEffect(() => {
    const loadImage = async () => {
      setImage(null);
      setImage(await testPlugin(plugin.plugin, plugin));
    };

    if (plugin !== null) {
      loadImage();
    }
  }, [plugin]);

  return (
    <Stack gap={2} sx={{ margin: "2rem", marginBottom: "1rem" }}>
      {image === null ? (
        <CircularProgress />
      ) : (
        <>
          <Zoom>
            <img src={image} alt="Preview" style={{ width: "100%" }} />
          </Zoom>
        </>
      )}
    </Stack>
  );
};

export default PluginPreview;
