"use client";

import { useState, useEffect } from 'react';
import { Container, Grid, Typography, Paper, Box } from '@mui/material';
import Gauge from '../components/Gauge';
import ControlSwitch from '../components/Switch';
import { connectMQTT, getClient } from '../lib/mqtt';
import { MqttClient } from 'mqtt';

export default function Home() {
  const [moisture, setMoisture] = useState(0);
  const [temperature, setTemperature] = useState(0);
  const [humidity, setHumidity] = useState(0);
  const [pumpOn, setPumpOn] = useState(false);
  const [fanOn, setFanOn] = useState(false);

  useEffect(() => {
    const client: MqttClient = connectMQTT();

    client.on('message', (topic: string, message: Buffer) => {
      const value = parseFloat(message.toString());
      switch (topic) {
        case 'garden/sensors/moisture':
          setMoisture(value);
          break;
        case 'garden/sensors/temperature':
          setTemperature(value);
          break;
        case 'garden/sensors/humidity':
          setHumidity(value);
          break;
      }
    });

    return () => {
      client.end();
    };
  }, []);

  const handlePumpSwitch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newState = event.target.checked;
    setPumpOn(newState);
    const client = getClient();
    if (client) {
      client.publish('garden/controls/pump', newState ? '1' : '0');
    }
  };

  const handleFanSwitch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newState = event.target.checked;
    setFanOn(newState);
    const client = getClient();
    if (client) {
      client.publish('garden/controls/fan', newState ? '1' : '0');
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          IoT Garden Monitor
        </Typography>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Grid container spacing={3} justifyContent="center">
            <Grid item xs={12} sm={4}>
              <Box display="flex" justifyContent="center" alignItems="center">
                <Gauge id="moisture" value={moisture} label="Plot 1 - Moisture" />
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box display="flex" justifyContent="center" alignItems="center">
                <Gauge id="moisture" value={moisture} label="Plot 2 - Moisture" />
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box display="flex" justifyContent="center" alignItems="center">
                <Gauge id="moisture" value={moisture} label="Plot 3 - Moisture" />
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box display="flex" justifyContent="center" alignItems="center">
                <Gauge id="moisture" value={moisture} label="Plot 4 - Moisture" />
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box display="flex" justifyContent="center" alignItems="center">
                <Gauge id="temperature" value={temperature} label="Temperature" min={-20} max={50} />
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box display="flex" justifyContent="center" alignItems="center">
                <Gauge id="humidity" value={humidity} label="Humidity" />
              </Box>
            </Grid>
          </Grid>
        </Paper>
        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <ControlSwitch label="Pump" checked={pumpOn} onChange={handlePumpSwitch} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ControlSwitch label="Fan" checked={fanOn} onChange={handleFanSwitch} />
            </Grid>
          </Grid>
        </Paper>

      </Box>
    </Container>
  );
}