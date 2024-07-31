import React from 'react';
import { Switch, FormControlLabel, Typography } from '@mui/material';

interface ControlSwitchProps {
  label: string;
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ControlSwitch: React.FC<ControlSwitchProps> = ({ label, checked, onChange }) => {
  return (
    <FormControlLabel
      control={<Switch checked={checked} onChange={onChange} color="primary" />}
      label={<Typography variant="body1">{label}</Typography>}
    />
  );
};

export default ControlSwitch;