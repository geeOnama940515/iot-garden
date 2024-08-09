

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


## Create a .env.local file

```
MQTT_USERNAME=roger
MQTT_PASSWORD=password
MQTT_BROKER_URL=mqtt://xxx.xxx.xxx.xxx
MQTT_PORT=1993 //1883 for mqtt; 1993//for ws or whatever is config to your mqtt broker
```


## Arduino IDE Setup

```
Check this link : https://www.instructables.com/Quick-Start-to-Nodemcu-ESP8266-on-Arduino-IDE/
Install PubSubClient library
Install DHT11 library
```

## Arduino Code

```
Copy the arduino_code.ino to your preferred arduino IDE
Change Wifi Settings and MQTT Settings

```