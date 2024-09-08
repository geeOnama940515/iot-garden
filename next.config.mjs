/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    env: {
      MQTT_USERNAME: process.env.MQTT_USERNAME,
      MQTT_PASSWORD:process.env.MQTT_PASSWORD,
      MQTT_BROKER_URL: process.env.MQTT_BROKER_URL,
      MQTT_PORT: process.env.MQTT_PORT,
      BASE_URL: process.env.BASE_URL
    }
  }

export default nextConfig;
