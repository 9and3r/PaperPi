import { Card, CardActionArea, Stack, Typography } from "@mui/material";
import { getPluginSampleImageUrl } from "../endpoint_manager";

const PluginItem = (props) => {
  const { plugin, version, onClick } = props;
  return (
    <Card sx={{ width: "100%" }}>
      <CardActionArea onClick={onClick} sx={{ padding: "1rem" }}>
        <Stack direction="row" gap={2} justifyContent="space-between">
          <Stack gap={1}>
            <Typography variant="h4">{plugin}</Typography>
            <div>{version}</div>
          </Stack>
          <img
            style={{ maxHeight: "5rem" }}
            src={getPluginSampleImageUrl(plugin)}
            alt={plugin + " sample"}
          />
        </Stack>
      </CardActionArea>
    </Card>
  );
};

export default PluginItem;
