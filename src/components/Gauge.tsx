import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

interface GaugeProps {
  id: string;
  value: number;
  label: string;
  min?: number;
  max?: number;
}

const Gauge: React.FC<GaugeProps> = ({ id, value, label, min = 0, max = 100 }) => {
  const normalizedValue = ((value - min) / (max - min)) * 100;

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress variant="determinate" value={normalizedValue} size={100} />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="caption" component="div" color="text.secondary">
            {`${(value)}${label.includes('Temperature') ? '°C' : '%'}`}
          </Typography>
        </Box>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {label}
      </Typography>
    </Box>
  );
};

export default Gauge;