//Esp8266 Reference : http://arduino.esp8266.com/stable/package_esp8266com_index.json


// Include necessary libraries
#include <PubSubClient.h>  // For MQTT communication
#include <ESP8266WiFi.h>   // For WiFi connectivity on ESP8266
#include <DHT.h>           // For AM2301 temperature and humidity sensor

// WiFi credentials
const char* ssid = "I/S";           // Your WiFi network name
const char* wifi_password = "p@$$W0rd@123";  // Your WiFi password

// MQTT settings
const char* mqtt_server = "192.168.1.179";  // MQTT broker address
const char* clientID = "ESP8266ClientxGreenhouse";  // MQTT client ID

// MQTT topics
const char* soil_moisture_topic = "sensor/greenhouse/moisture";  // Topic for publishing soil moisture data
const char* temperature_topic = "sensor/greenhouse/temperature"; // Topic for publishing temperature data
const char* humidity_topic = "sensor/greenhouse/humidity";       // Topic for publishing humidity data
const char* pump_control_topic = "cmnd/greenhouse/pump";   // Topic for pump control commands
const char* fan_control_topic = "cmnd/greenhouse/fan";     // Topic for fan control commands
const char* pump_mode_topic = "cmnd/greenhouse/pump_mode"; // Topic for pump mode control commands
const char* fan_mode_topic = "cmnd/greenhouse/fan_mode";   // Topic for fan mode control commands

// Pin definitions
const int relay_pin = 5;     // D1 - Connected to relay for pump control
const int dht_pin = 2;       // D4 - Connected to AM2301 sensor
const int fan_pin = 4;       // D2 - Connected to fan control relay
// Note: Soil moisture sensor is connected to A0, which doesn't need to be defined

// Moisture thresholds
float upper_limit = 75.0; // Upper moisture threshold to turn off pump (75% moisture)
float lower_limit = 50.0; // Lower moisture threshold to turn on pump (55% moisture)

// Timing variables
unsigned long last_publish_time = 0;
const unsigned long publish_interval = 10000; // Publish data every 10 seconds

// Control flags
bool manual_control = false;  // Flag to indicate if pump is under manual control
bool fan_auto_mode = true;    // Flag to indicate if fan is under automatic control

// Initialize AM2301 sensor
#define DHTTYPE DHT21   // DHT 21 (AM2301)
DHT dht(dht_pin, DHTTYPE);

// Initialize WiFi and MQTT client objects
WiFiClient wifi_client;
PubSubClient mqtt_client(mqtt_server, 1883, wifi_client);

void setup() {
    Serial.begin(9600);  // Initialize serial communication for debugging
    pinMode(relay_pin, OUTPUT);  // Set relay pin as output
    pinMode(A0, INPUT);  // Set A0 as input for soil moisture sensor
    pinMode(fan_pin, OUTPUT);  // Set fan pin as output
    digitalWrite(fan_pin, HIGH);  // Initialize fan as OFF

    dht.begin();  // Initialize AM2301 sensor

    connect_wifi();  // Connect to WiFi network
    mqtt_client.setCallback(mqtt_callback);  // Set up MQTT message callback
}

void loop() {
    // Ensure MQTT connection is maintained
    if (!mqtt_client.connected()) {
        connect_mqtt();
    }
    mqtt_client.loop();  // Process incoming MQTT messages

    // Check if it's time to publish sensor data
    unsigned long now = millis();
    if (now - last_publish_time > publish_interval) {
        last_publish_time = now;
        publish_sensor_data();  // Read sensor and publish data
    }
}

// Function to connect to WiFi network
void connect_wifi() {
    Serial.print("Connecting to ");
    Serial.println(ssid);
    WiFi.begin(ssid, wifi_password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected");
    Serial.println("IP address: " + WiFi.localIP().toString());
}

// Function to connect to MQTT broker
void connect_mqtt() {
    while (!mqtt_client.connected()) {
        Serial.println("Connecting to MQTT Broker...");
        if (mqtt_client.connect(clientID)) {
            Serial.println("Connected to MQTT Broker!");
            mqtt_client.subscribe(pump_control_topic);  // Subscribe to pump control topic
            mqtt_client.subscribe(fan_control_topic);    // Subscribe to fan control topic
            mqtt_client.subscribe(pump_mode_topic);     // Subscribe to pump mode topic
            mqtt_client.subscribe(fan_mode_topic);      // Subscribe to fan mode topic
        } else {
            Serial.println("Connection to MQTT Broker failed. Retrying in 5 seconds...");
            delay(5000);
        }
    }
}

// Function to read sensor data and publish to MQTT
void publish_sensor_data() {
    // Read soil moisture sensor data
    int sensor_reading = analogRead(A0);
    float moisture_percentage = 100.0 - ((sensor_reading / 1023.0) * 100.0);
    
    // Read humidity and temperature from AM2301
    float humidity = dht.readHumidity();
    float temperature = dht.readTemperature();

    // Check if any reads failed and exit early (to try again).
    if (isnan(humidity) || isnan(temperature)) {
        Serial.println("Failed to read from AM2301 sensor!");
        return;
    }

    // Print and publish moisture data
    Serial.printf("Moisture Percentage: %.2f%%\n", moisture_percentage);
    mqtt_client.publish(soil_moisture_topic, String(moisture_percentage).c_str());

    // Print and publish temperature and humidity data
    Serial.printf("Temperature: %.2f°C\n", temperature);
    mqtt_client.publish(temperature_topic, String(temperature).c_str());
    Serial.printf("Humidity: %.2f%%\n", humidity);
    mqtt_client.publish(humidity_topic, String(humidity).c_str());

    // Temperature-based fan control if in automatic mode
    if (fan_auto_mode) {
        if (temperature > 32) {
            set_fan_state(true);
        } else {
            set_fan_state(false);
        }
    }

    // Control pump if not in manual mode
    if (!manual_control) {
        control_pump(moisture_percentage);
    }
}

// Function to control pump based on moisture level
void control_pump(float moisture_percentage) {
    if (moisture_percentage <= lower_limit) {
        set_pump_state(true);  // Turn on pump if moisture is below lower limit
    } else if (moisture_percentage >= upper_limit) {
        set_pump_state(false); // Turn off pump if moisture is above upper limit
    }
    // If moisture is between lower and upper limits, maintain current pump state
}

// Function to set pump state and publish status
void set_pump_state(bool on) {
    static bool current_pump_state = false;
    if (on != current_pump_state) {
        current_pump_state = on;
        digitalWrite(relay_pin, on ? LOW : HIGH); // LOW turns on the pump, HIGH turns it off
        mqtt_client.publish(pump_control_topic, on ? "ON" : "OFF");
        Serial.println(on ? "Pump turned ON" : "Pump turned OFF");
    }
}

// Function to set fan state and publish status
void set_fan_state(bool on) {
    static bool current_fan_state = false;
    if (on != current_fan_state) {
        current_fan_state = on;
        digitalWrite(fan_pin, on ? LOW : HIGH); // LOW turns on the fan, HIGH turns it off
        mqtt_client.publish(fan_control_topic, on ? "ON" : "OFF");
        Serial.println(on ? "Fan turned ON" : "Fan turned OFF");
    }
}

// MQTT message callback function
void mqtt_callback(char* topic, byte* message, unsigned int length) {
    String msg = "";
    for (unsigned int i = 0; i < length; i++) {
        msg += (char)message[i];
    }
    Serial.println("Message arrived on topic: " + String(topic) + ". Message: " + msg);

    if (strcmp(topic, pump_mode_topic) == 0) {
        if (msg == "OFFAUTO") {
            manual_control = true;
            Serial.println("Switching to manual pump control");
        } else if (msg == "ONAUTO") {
            manual_control = false;
            Serial.println("Switching to automatic pump control");
        }
    } else if (strcmp(topic, fan_mode_topic) == 0) {
        if (msg == "OFFAUTO") {
            fan_auto_mode = false;
            Serial.println("Switching to manual fan control");
        } else if (msg == "ONAUTO") {
            fan_auto_mode = true;
            Serial.println("Switching to automatic fan control");
        }
    } else if (strcmp(topic, pump_control_topic) == 0) {
        if (manual_control) {
            if (msg == "OFF") {
                set_pump_state(false);
            } else if (msg == "ON") {
                set_pump_state(true);
            }
        }
    } else if (strcmp(topic, fan_control_topic) == 0) {
        if (!fan_auto_mode) {
            if (msg == "OFF") {
                set_fan_state(false);
            } else if (msg == "ON") {
                set_fan_state(true);
            }
        }
    }
}
