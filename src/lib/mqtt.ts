import mqtt from 'mqtt';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://192.168.1.179';
const username = process.env.MQTT_USERNAME || 'roger';
const password = process.env.MQTT_PASSWORD || 'password';
const port = Number(process.env.MQTT_PORT) || 1993;

let client: mqtt.MqttClient | null = null;

export function connectMQTT(): mqtt.MqttClient {
  if (!client) {
    const options: mqtt.IClientOptions = {
      port:port,
      clientId: `mqtt_${Math.random().toString(16).slice(3)}`,
      reconnectPeriod: 1000, // Adjust reconnect period as needed
    };

    console.log('Connecting to MQTT broker with options:', options);

    client = mqtt.connect(brokerUrl, options);

    client.on('connect', () => {
      console.log('Connected to MQTT broker');
      // Subscribe to multiple topics
      const topics = ['cmnd/greenhouse/#','tele/greenhouse/#' ];
      topics.forEach(topic => {
        client!.subscribe(topic, (err) => {
          if (err) {
            console.error(`Subscription error for topic ${topic}:`, err.message);
          } else {
            console.log(`Subscribed to ${topic}`);
          }
        });
      });
    });

    client.on('error', (error) => {
      console.error('MQTT connection error:', error.message);
    });

    client.on('message', (topic: string, message: Buffer) => {
      console.log('Received message on topic:', topic, 'Message:', message.toString());
    });

    client.on('reconnect', () => {
      console.log('Reconnecting to MQTT broker');
    });

    client.on('offline', () => {
      console.log('MQTT client offline');
      client = null; // Force reconnection on next connectMQTT call
    });
  }
  return client;
}

export function getClient(): mqtt.MqttClient | null {
  return client;
}
