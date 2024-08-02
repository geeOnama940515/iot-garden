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
  const [temperature, setTemperature] = useState<string>("0");
  const [humidity, setHumidity] = useState<number>(0);
  const [pumpOn, setPumpOn] = useState<boolean>(false);
  const [fanOn, setFanOn] = useState<boolean>(false);
  const [mqttConnected, setMqttConnected] = useState<boolean>(false);

  useEffect(() => {
    const client: MqttClient = connectMQTT();

    client.on('connect', () => {
      setMqttConnected(true);
      client.subscribe('tele/greenhouse/SENSOR');
      client.subscribe('cmnd/greenhouse/#');
      client.subscribe('stat/greenhouse/#');
    });

    client.on('offline', () => {
      setMqttConnected(false);
    });

    client.on('message', (topic: string, message: Buffer) => {
      const payload = message.toString();
      try {
        

        if (topic === 'tele/greenhouse/SENSOR') {
          const data = JSON.parse(payload);
          if (data.DHT11) {
            setTemperature(data.DHT11.Temperature);
            setHumidity(parseFloat(data.DHT11.Humidity.toFixed(2)));
          }
        } else if (topic === 'greenhouse/sensors/moisture') {
          setMoisture(parseFloat(payload));

        } else if (topic === 'cmnd/greenhouse/POWER1') {
          setPumpOn(convertPayloadToBoolean(payload));
          console.log(payload);
        }
        else if (topic === 'stat/greenhouse/POWER1') {
          setPumpOn(convertPayloadToBoolean(payload));
        }
        else if (topic === 'stat/greenhouse/POWER2') {
          setFanOn(convertPayloadToBoolean(payload));
        }

        else if (topic === 'cmnd/greenhouse/POWER2') {
          setFanOn(convertPayloadToBoolean(payload));
          console.log("Payload: ",payload);
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
    if (payload === '1' || payload.toUpperCase() === 'ON') {
      return true;
    } else if (payload === '0' || payload.toUpperCase() === 'OFF') {
      return false;
    }
    return false; // Default to false if unrecognized
  };
  const handlePumpSwitch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newState = event.target.checked;
    setPumpOn(newState);
    const client = getClient();
    if (client) {
      client.publish('cmnd/greenhouse/POWER1', newState ? 'ON' : 'OFF');
    }
  };

  const handleFanSwitch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newState = event.target.checked;
    setFanOn(newState);
    const client = getClient();
    if (client) {
      client.publish('cmnd/greenhouse/POWER2', newState ? 'ON' : 'OFF');
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
                <Gauge id="moisture1" value={parseFloat(moisture.toFixed(2))} label="Plot 1 - Moisture" />
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box display="flex" justifyContent="center" alignItems="center">
                <Gauge id="moisture2" value={parseFloat(moisture.toFixed(2))} label="Plot 2 - Moisture" />
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box display="flex" justifyContent="center" alignItems="center">
                <Gauge id="moisture3" value={parseFloat(moisture.toFixed(2))} label="Plot 3 - Moisture" />
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box display="flex" justifyContent="center" alignItems="center">
                <Gauge id="moisture4" value={parseFloat(moisture.toFixed(2))} label="Plot 4 - Moisture" />
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box display="flex" justifyContent="center" alignItems="center">
                <Gauge id="temperature" value={Number(temperature)} label="Temperature" min={-20} max={50} />
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
