import { useEffect, useState } from "react";
import DynamicOption from "./dynamic_option";
import { getMainConfigInfo } from "../endpoint_manager";
import { Card, Stack } from "@mui/material";

const MainConfiguration = (props) => {
  const { config, onConfigChange } = props;
  const [configOptions, setConfigOptions] = useState([]);

  useEffect(() => {
    const loadMainConfigInfo = async () => {
      let response = await getMainConfigInfo();
      setConfigOptions(Object.entries(response.main));
    };
    loadMainConfigInfo();
  }, []);

  return (
    <Card
      sx={{
        padding: "1rem",
        paddingTop: 0,
      }}
    >
      <Stack gap={3}>
        <h2>General configuration</h2>
        {configOptions.map(([key, value]) => {
          return (
            <DynamicOption
              key={key}
              value={config[key]}
              option={value}
              label={key}
              onChange={(newValue) => {
                onConfigChange(key, newValue);
              }}
            />
          );
        })}
      </Stack>
    </Card>
  );
};

export default MainConfiguration;
