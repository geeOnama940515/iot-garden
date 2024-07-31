"use client";

import { useState, useEffect } from 'react';
import { Container, Grid, Typography, Paper, Box, Tooltip } from '@mui/material';
import { CloudDone, CloudOff } from '@mui/icons-material';
import Gauge from '../components/Gauge';
import ControlSwitch from '../components/Switch';
import { connectMQTT, getClient } from '../lib/mqtt';
import { MqttClient } from 'mqtt';

export default function Home() {
  const [moisture, setMoisture] = useState<number>(0);
  const [temperature, setTemperature] = useState<number>(0);
  const [humidity, setHumidity] = useState<number>(0);
  const [pumpOn, setPumpOn] = useState<boolean>(false);
  const [fanOn, setFanOn] = useState<boolean>(false);
  const [mqttConnected, setMqttConnected] = useState<boolean>(false);

  useEffect(() => {
    const client: MqttClient = connectMQTT();

    client.on('connect', () => {
      setMqttConnected(true);
    });

    client.on('offline', () => {
      setMqttConnected(false);
    });

    client.on('message', (topic: string, message: Buffer) => {
      const value = parseFloat(message.toString());
      switch (topic) {
        case 'greenhouse/sensors/moisture':
          setMoisture(value);
          break;
        case 'greenhouse/sensors/temperature':
          setTemperature(value);
          break;
        case 'greenhouse/sensors/humidity':
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
      client.publish('greenhouse/controls/pump', newState ? '1' : '0');
    }
  };

  const handleFanSwitch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newState = event.target.checked;
    setFanOn(newState);
    const client = getClient();
    if (client) {
      client.publish('greenhouse/controls/fan', newState ? '1' : '0');
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 5, px: 2 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          IoT Greenhouse Monitor
        </Typography>

        <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            MQTT Connection Status : 
            <Tooltip title={mqttConnected ? "MQTT Connected" : "MQTT Disconnected"}>
              <Box component="span" sx={{ ml: 2, verticalAlign: 'middle', display: 'inline-flex' }}>
                {mqttConnected ? (
                  <CloudDone color="success" />
                ) : (
                  <CloudOff color="error" />
                )}
              </Box>
            </Tooltip>
          </Typography>
        </Paper>
          
        <Paper elevation={3} sx={{ p: 3 }}>
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} sm={4}>
              <Box display="flex" justifyContent="center" alignItems="center">
                <Gauge id="moisture1" value={moisture} label="Plot 1 - Moisture" />
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box display="flex" justifyContent="center" alignItems="center">
                <Gauge id="moisture2" value={moisture} label="Plot 2 - Moisture" />
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box display="flex" justifyContent="center" alignItems="center">
                <Gauge id="moisture3" value={moisture} label="Plot 3 - Moisture" />
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box display="flex" justifyContent="center" alignItems="center">
                <Gauge id="moisture4" value={moisture} label="Plot 4 - Moisture" />
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