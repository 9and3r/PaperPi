import { Button, Dialog, Modal, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import BasicDialog from "./basic_dialog";

const ChangePluginName = (props) => {
  const { open, onClose, initialName, onNameChange, names } = props;
  const [newName, setNewName] = useState(initialName);

  useEffect(() => {
    if (open) {
      setNewName(initialName);
    }
  }, [initialName, open]);

  const nameEmpty = newName.trim().length === 0;
  const duplicatedName = names.includes(newName) && newName !== initialName;

  const error = nameEmpty || duplicatedName;

  return (
    <BasicDialog
      open={open}
      onClose={onClose}
      onAccept={() => {
        onNameChange(initialName, newName);
      }}
      acceptButtonLabel="Change name"
      disableAcceptButton={error}
      title="Set a new name"
      render={
        <TextField
          value={newName}
          helperText={
            nameEmpty
              ? "Name cannot be empty"
              : duplicatedName
              ? "Name cannot be duplicated"
              : null
          }
          onChange={(event) => {
            setNewName(event.target.value);
          }}
          error={error}
        />
      }
    />
  );
};

export default ChangePluginName;
