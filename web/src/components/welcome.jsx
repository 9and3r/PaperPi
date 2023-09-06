import { Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { ReactComponent as Logo } from "../PaperPi.svg";

const Welcome = (props) => {
  const [loading, setLoading] = useState(true);

  const [inverted, setInverted] = useState(false);

  useEffect(() => {
    setInverted(loading);
  }, [loading]);

  return (
    <Stack
      justifyContent="center"
      alignItems="center"
      sx={{
        height: "100vh",
        backgroundColor: inverted ? "white" : "black",
        transition: "background-color 1.5s ease",
      }}
      gap={3}
    >
      <Typography variant="h3" color={inverted ? "black" : "white"}>
        PaperPi
      </Typography>
      <Logo />
      {loading ? <CircularProgress /> : null}
      <Button onClick={() => setLoading(!loading)}>Chagne</Button>
    </Stack>
  );
};

export default Welcome;
