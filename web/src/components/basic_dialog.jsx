import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fade,
  Slide,
} from "@mui/material";
import { forwardRef } from "react";

const BasicDialog = (props) => {
  const {
    open,
    onClose,
    render,
    onAccept,
    acceptButtonLabel = "Accept",
    disableAcceptButton = false,
    showAccept = true,
    title,
  } = props;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      scroll="paper"
      TransitionComponent={Slide}
      TransitionProps={{ direction: "up" }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers={true} sx={{ minWidth: "min(500px, 50vw)" }}>
        {render}
      </DialogContent>
      <DialogActions sx={{ justifyContent: "space-between" }}>
        <Button onClick={onClose}>Cancel</Button>
        {showAccept ? (
          <Button
            onClick={onAccept}
            disabled={disableAcceptButton}
            variant="contained"
            sx={{ marginLeft: "5rem" }}
          >
            {acceptButtonLabel}
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
};

export default BasicDialog;
