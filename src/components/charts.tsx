import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// import { Sensor } from '../path-to-your-home-component';




interface Sensor {
    id: number;
    sensorType: string;
    sensorReading: string;
    dateCreated: string;
}

interface SensorChartProps {
    data: Sensor[];
}

const SensorChart: React.FC<SensorChartProps> = ({ data }) => {
    // Convert the sensor data into a format suitable for the chart
    const chartData = data.map(sensor => ({
        date: new Date(sensor.dateCreated).toLocaleDateString(),
        value: parseFloat(sensor.sensorReading)
    }));

    return (
        <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#8884d8" />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default SensorChart;
