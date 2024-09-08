import axios from 'axios';

let base_url = "http://localhost:5016"; // Ensure the environment variable is correctly set

const apiService = {
  // Method to add sensor data
  addSensorData: async (sensorData: { id: number; sensorType: string; sensorReading: string; dateCreated: string }) => {
    try {
      const response = await axios.post(`${base_url}/api/Sensor/AddSensorData`, sensorData);
      return response.data;
    } catch (error) {
      console.error('Error adding sensor data:', error);
      throw error;
    }
  },

  // Method to get all sensor data
  getAllSensorData: async () => {
    try {
      const response = await axios.get(`${base_url}/api/Sensor/GetAllData`);
      return response.data; // This will be an array of sensor data objects
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      throw error;
    }
  }
};

export default apiService;
