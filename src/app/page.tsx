"use client";

import { useState, useEffect } from 'react';
import {
  Container, Grid, Typography, Paper, Box, Tooltip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination
} from '@mui/material';
import { CloudDone, CloudOff } from '@mui/icons-material';
import Gauge from '../components/Gauge';
import ControlSwitch from '../components/Switch';
import SensorChart from '../components/charts';
import { connectMQTT, getClient } from '../lib/mqtt';
import { MqttClient } from 'mqtt';
import apiService from '../lib/apiService';

export interface Sensor {
  id: number;
  sensorType: string;
  sensorReading: string;
  dateCreated: string;
}
let tblNUmber = 1;
export default function Home() {
  const [moisture, setMoisture] = useState<number>(0);
  const [temperature, setTemperature] = useState<number>(0);
  const [humidity, setHumidity] = useState<number>(0);
  const [pumpOn, setPumpOn] = useState<boolean>(false);
  const [fanOn, setFanOn] = useState<boolean>(false);
  const [autoPumpMode, setAutoPumpMode] = useState<boolean>(false);
  const [autoFanMode, setAutoFanMode] = useState<boolean>(false);
  const [mqttConnected, setMqttConnected] = useState<boolean>(false);

  // State for sensor data and pagination
  const [sensorData, setSensorData] = useState<Sensor[]>([]);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);

  useEffect(() => {
    // MQTT Connection setup
    const client: MqttClient = connectMQTT();

    client.on('connect', () => {
      setMqttConnected(true);
      client.subscribe('sensor/greenhouse/#');
      client.subscribe('cmnd/greenhouse/#');
    });

    client.on('offline', () => {
      setMqttConnected(false);
    });

    client.on('message', async (topic: string, message: Buffer) => {
      const payload = message.toString();
      try {
        let newSensorData: Sensor | null = null;
        if (topic === 'sensor/greenhouse/moisture') {
          const moistureValue = parseFloat(payload);
          setMoisture(moistureValue);
          newSensorData = {
            id: 0,
            sensorType: 'Moisture',
            sensorReading: moistureValue.toFixed(2).toString(),
            dateCreated: new Date().toISOString()
          };
        } else if (topic === 'sensor/greenhouse/temperature') {
          const temperatureValue = parseFloat(payload);
          setTemperature(temperatureValue);
          newSensorData = {
            id: 0,
            sensorType: 'Temperature',
            sensorReading: temperatureValue.toFixed(2).toString(),
            dateCreated: new Date().toISOString()
          };
        } else if (topic === 'sensor/greenhouse/humidity') {
          const humidityValue = parseFloat(payload);
          setHumidity(humidityValue);
          newSensorData = {
            id: 0,
            sensorType: 'Humidity',
            sensorReading: humidityValue.toFixed(2).toString(),
            dateCreated: new Date().toISOString()
          };
        } else if (topic === 'cmnd/greenhouse/pump') {
          setPumpOn(convertPayloadToBoolean(payload));
        } else if (topic === 'cmnd/greenhouse/fan') {
          setFanOn(convertPayloadToBoolean(payload));
        } else if (topic === 'cmnd/greenhouse/pump_mode') {
          setAutoPumpMode(payload === 'ONAUTO');
        } else if (topic === 'cmnd/greenhouse/fan_mode') {
          setAutoFanMode(payload === 'ONAUTO');
        }

        // If new sensor data is available, save it and update the table
        if (newSensorData) {
          await apiService.addSensorData(newSensorData);
          setSensorData(prevData => [newSensorData, ...prevData]);
        }
      } catch (e) {
        console.error('Failed to parse MQTT message or add sensor data:', e);
      }
    });

    return () => {
      client.end();
    };
  }, []);

  // Fetch sensor data for the table
  useEffect(() => {
    async function fetchSensorData() {
      try {
        const data = await apiService.getAllSensorData();
        setSensorData(data);
      } catch (error) {
        console.error('Failed to fetch sensor data:', error);
      }
    }

    fetchSensorData();
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

  // Pagination controls
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter sensor data by type
  const moistureData = sensorData.filter(sensor => sensor.sensorType === 'Moisture');
  const temperatureData = sensorData.filter(sensor => sensor.sensorType === 'Temperature');
  const humidityData = sensorData.filter(sensor => sensor.sensorType === 'Humidity');

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

        {/* Add SensorChart component for each sensor type */}
        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Moisture Sensor Data Chart
          </Typography>
          <Box sx={{ height: 400 }}>
            <SensorChart data={moistureData} />
          </Box>
        </Paper>

        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Temperature Sensor Data Chart
          </Typography>
          <Box sx={{ height: 400 }}>
            <SensorChart data={temperatureData} />
          </Box>
        </Paper>

        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Humidity Sensor Data Chart
          </Typography>
          <Box sx={{ height: 400 }}>
            <SensorChart data={humidityData} />
          </Box>
        </Paper>




        {/* Paginated Table for Sensor Data */}
        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Sensor Data
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Sensor Type</TableCell>
                  <TableCell>Reading</TableCell>
                  <TableCell>Date Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sensorData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((sensor) => (
                  <TableRow key={sensor.id}>
                    <TableCell>{sensor.sensorType}</TableCell>
                    <TableCell>{sensor.sensorReading}</TableCell>
                    <TableCell>{new Date(sensor.dateCreated).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={sensorData.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </Paper>
      </Box>
    </Container>
  );
}
