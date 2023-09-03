import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";

const DynamicOption = (props) => {
  const { value, label, option, onChange, disabled = false } = props;

  if (option.type === "bool") {
    return (
      <FormControl fullWidth>
        <FormControlLabel
          control={
            <Checkbox
              checked={value}
              onChange={(event) => {
                onChange(event.target.checked);
              }}
            />
          }
          label={label}
        />
        <FormHelperText>{option.description}</FormHelperText>
      </FormControl>
    );
  }
  if ("choice" in option) {
    return (
      <FormControl fullWidth>
        <InputLabel>{label}</InputLabel>
        <Select
          value={option["choice"].indexOf(value) >= 0 ? value : ""}
          label={label}
          onChange={(event) => onChange(event.target.value)}
        >
          {option["choice"].map((item) => {
            return (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            );
          })}
        </Select>
        <FormHelperText>{option.description}</FormHelperText>
      </FormControl>
    );
  }
  const error =
    option.type === "int"
      ? isNaN(parseInt(value))
      : option.type === "float"
      ? isNaN(parseFloat(value))
      : value != null
      ? value.trim().length === 0
      : true;
  return (
    <TextField
      label={label}
      value={value}
      type={option.type === "int" ? "number" : "text"}
      helperText={option.description}
      disabled={disabled}
      error={error}
      onChange={(event) => {
        let textFieldValue = event.target.value;
        if (option.type === "int") {
          textFieldValue = parseInt(textFieldValue);
          if (isNaN(textFieldValue)) {
            textFieldValue = event.target.value;
          }
        }
        if (option.type === "float") {
          textFieldValue = parseFloat(textFieldValue);
          if (isNaN(textFieldValue)) {
            textFieldValue = event.target.value;
          }
        }
        onChange(textFieldValue);
      }}
    />
  );
};

export default DynamicOption;
