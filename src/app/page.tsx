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
  const [autoPumpMode, setAutoPumpMode] = useState<boolean>(false);
  const [autoFanMode, setAutoFanMode] = useState<boolean>(false);
  const [mqttConnected, setMqttConnected] = useState<boolean>(false);

  useEffect(() => {
    const client: MqttClient = connectMQTT();

    client.on('connect', () => {
      setMqttConnected(true);
      client.subscribe('sensor/greenhouse/#');
      client.subscribe('cmnd/greenhouse/#');
    });

    client.on('offline', () => {
      setMqttConnected(false);
    });

    client.on('message', (topic: string, message: Buffer) => {
      const payload = message.toString();
      try {
        if (topic === 'sensor/greenhouse/moisture') {
          setMoisture(parseFloat(payload));
        } else if (topic === 'sensor/greenhouse/temperature') {
          setTemperature(parseFloat(payload));
        } else if (topic === 'sensor/greenhouse/humidity') {
          setHumidity(parseFloat(payload));
        } else if (topic === 'cmnd/greenhouse/pump') {
          setPumpOn(convertPayloadToBoolean(payload));
        } else if (topic === 'cmnd/greenhouse/fan') {
          setFanOn(convertPayloadToBoolean(payload));
        } else if (topic === 'cmnd/greenhouse/pump_mode') {
          setAutoPumpMode(payload === 'ONAUTO');
        } else if (topic === 'cmnd/greenhouse/fan_mode') {
          setAutoFanMode(payload === 'ONAUTO');
        }
      } catch (e) {
        console.error('Failed to parse MQTT message:', e);
      }
    });

    return () => {
      client.end();
    };
  }, []);

  const convertPayloadToBoolean = (payload: string): boolean => {
    return payload.toLowerCase() === 'on';
  };

  const handlePumpSwitch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newState = event.target.checked;
    setPumpOn(newState);
    const client = getClient();
    if (client) {
      if (autoPumpMode) {
        client.publish('cmnd/greenhouse/pump_mode', newState ? 'ONAUTO' : 'OFFAUTO');
      } else {
        client.publish('cmnd/greenhouse/pump', newState ? 'ON' : 'OFF');
      }
    }
  };

  const handleFanSwitch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newState = event.target.checked;
    setFanOn(newState);
    const client = getClient();
    if (client) {
      if (autoFanMode) {
        client.publish('cmnd/greenhouse/fan_mode', newState ? 'ONAUTO' : 'OFFAUTO');
      } else {
        client.publish('cmnd/greenhouse/fan', newState ? 'ON' : 'OFF');
      }
    }
  };

  const handleAutoPumpMode = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newState = event.target.checked;
    setAutoPumpMode(newState);
    const client = getClient();
    if (client) {
      client.publish('cmnd/greenhouse/pump_mode', newState ? 'ONAUTO' : 'OFFAUTO');
    }
  };

  const handleAutoFanMode = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newState = event.target.checked;
    setAutoFanMode(newState);
    const client = getClient();
    if (client) {
      client.publish('cmnd/greenhouse/fan_mode', newState ? 'ONAUTO' : 'OFFAUTO');
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 5, px: 2 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Greenhouse | Monitor
        </Typography>

        <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            MQTT Connection Status:
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
                <Gauge id="moisture" value={parseFloat(moisture.toFixed(2))} label="Soil Moisture" />
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box display="flex" justifyContent="center" alignItems="center">
                <Gauge id="temperature" value={parseFloat(temperature.toFixed(2))} label="Temperature" min={-20} max={50} />
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box display="flex" justifyContent="center" alignItems="center">
                <Gauge id="humidity" value={parseFloat(humidity.toFixed(2))} label="Humidity" />
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={3}>
              <ControlSwitch label="Pump" checked={pumpOn} onChange={handlePumpSwitch} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <ControlSwitch label="Fan" checked={fanOn} onChange={handleFanSwitch} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <ControlSwitch label="Auto Pump Mode" checked={autoPumpMode} onChange={handleAutoPumpMode} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <ControlSwitch label="Auto Fan Mode" checked={autoFanMode} onChange={handleAutoFanMode} />
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
}
