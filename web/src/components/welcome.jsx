import {
  Alert,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { ReactComponent as Logo } from "../PaperPi.svg";

const Welcome = (props) => {
  const { loaded, error } = props;

  return (
    <Paper>
      <Stack
        justifyContent="center"
        alignItems="center"
        sx={{
          height: "100vh",
        }}
        gap={3}
      >
        <Typography variant="h3">PaperPi</Typography>
        <Logo style={{ maxWidth: "30rem" }} />
        {!loaded ? <CircularProgress /> : null}
        {error !== null ? (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => window.location.reload()}
              >
                Reload website
              </Button>
            }
          >
            {error.message}
          </Alert>
        ) : null}
      </Stack>
    </Paper>
  );
};

export default Welcome;
