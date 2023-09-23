import {
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { testPlugin } from "../endpoint_manager";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

const PluginPreview = (props) => {
  const { plugin } = props;

  const [image, setImage] = useState(null);

  const modes = ["1", "L", "RGB"];

  const [previewConfig, setPreviewConfig] = useState({
    resolution: [400, 300],
    mode: "1",
  });

  useEffect(() => {
    const loadImage = async () => {
      setImage(null);
      setImage(await testPlugin(plugin));
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
        <Stack direction="row" gap={3}>
          <Box sx={{ flexGrow: 1 }}>
            <Zoom>
              <img src={image} alt="Preview" style={{ width: "100%" }} />
            </Zoom>
          </Box>
          <Stack>
            <FormControl fullWidth>
              <InputLabel>Mode</InputLabel>
              <Select
                value={previewConfig.mode}
                label="Mode"
                //onChange={(event) => onChange(event.target.value)}
              >
                {modes.map((item) => {
                  return (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  );
                })}
              </Select>
              <FormHelperText>Helper text</FormHelperText>
            </FormControl>
          </Stack>
        </Stack>
      )}
    </Stack>
  );
};

export default PluginPreview;
