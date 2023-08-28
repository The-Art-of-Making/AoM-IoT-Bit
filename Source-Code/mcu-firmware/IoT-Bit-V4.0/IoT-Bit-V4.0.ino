/*
 * Authors: Mark Hofmeister, Issam Abushaban, Benjamin Esquieres
 * Created: 7/30/2022
 * Last Updated: 03/27/2023
 * Version: V4.0
 *
 */

#include "Wifi_Setup.h" // Header file for wifi setup functions
#include "pb_decode.h"
#include "controller_message.pb.h"
#include "AoM_IoT_devices.h"

/* SD card attached to SPI bus as follows, do not use these pins
 *  MOSI  - pin 11
 *  MISO  - pin 12
 *  CLK   - pin 13
 *  CS    - pin  4
 */

#define DEVICE_0_PIN 0
#define DEVICE_1_PIN 1

Device device0(DEVICE_0_PIN, 0); // Device 0 will be a digital input
Device device1(DEVICE_1_PIN, 1); // Device 1 will be a digital output

int pubSwitch = A1;  // The pin for reading the PUB switch status
int recvSwitch = A2; // The pin for reading the RECV switch status

int pubLED = A3;  // The pin for outputing the POST status to an LED
int recvLED = A6; // The pin for outputing the GET status to an LED

int wifiStatusLED = 6; // The pin for outputing the wifi connection status to an LED

unsigned long LEDDelayPeriod = 500;
unsigned long statusUpdatePeriod = 2000;
unsigned long statusUpdateNext = 0;

bool publish = false;

// Buffers for each device topic
#define MAX_TOPIC_SIZE 256
char device0ConfigTopic[MAX_TOPIC_SIZE];
char device0StateTopic[MAX_TOPIC_SIZE];
char device0CmdTopic[MAX_TOPIC_SIZE];
char device1ConfigTopic[MAX_TOPIC_SIZE];
char device1StateTopic[MAX_TOPIC_SIZE];
char device1CmdTopic[MAX_TOPIC_SIZE];

void setup()
{
  /* Begins Serial monitor for debugging purposes. */
  Serial.begin(9600);

  pinMode(pubSwitch, INPUT);
  pinMode(recvSwitch, INPUT);

  pinMode(wifiStatusLED, OUTPUT);
  pinMode(pubLED, OUTPUT);
  pinMode(recvLED, OUTPUT);

  /* Attempt to read from secrets.txt */
  do
  {
    for (int i = 0; i < 3; i++)
    {
      digitalWrite(recvLED, HIGH);
      digitalWrite(pubLED, HIGH);
      digitalWrite(wifiStatusLED, HIGH);
      delay(100);

      digitalWrite(recvLED, LOW);
      digitalWrite(pubLED, LOW);
      digitalWrite(wifiStatusLED, LOW);
      delay(100);
    }

    /* Wait 3 seconds before initializing */
    Serial.print("Checking For SD card in...");
    Serial.print("3...");
    delay(1000);
    Serial.print("2...");
    delay(1000);
    Serial.print("1...");
    delay(1000);
    Serial.println("0");
    delay(1000);
  } while (initializeCredentials() == false);

  /* Let them know that the device is ready */
  digitalWrite(recvLED, HIGH);
  digitalWrite(pubLED, HIGH);
  digitalWrite(wifiStatusLED, HIGH);
  delay(1000);
  digitalWrite(recvLED, LOW);
  digitalWrite(pubLED, LOW);
  digitalWrite(wifiStatusLED, LOW);
  delay(1000);
}

void loop()
{
  if (millis() > statusUpdateNext)
  {
    Serial.print("\nReceive Mode Switch: ");
    Serial.println(digitalRead(recvSwitch));
    Serial.print("Publish Mode Switch: ");
    Serial.println(digitalRead(pubSwitch));
    statusUpdateNext = millis() + statusUpdatePeriod;
  }

  if (!wifiConnected()) /* Determine if wifi connection needs to be restablished. */
  {
    /* Connection to WiFi terminated */
    digitalWrite(wifiStatusLED, LOW);
    digitalWrite(pubLED, LOW);
    digitalWrite(recvLED, LOW);

    /* Attempt to restablish connection */
    Serial.println("Initializing connection to WIFI...");
    if (connectToWIFI())
    {
      /* Connection to WiFi established */
      digitalWrite(wifiStatusLED, HIGH);
    }
  }
  else if (!pubSubClient.connected())
  {
    connectPubSubClient(callback);

    // Build device 0 topics
    buildTopic(clientUsername, DEVICE_0, CONFIG, device0ConfigTopic, MAX_TOPIC_SIZE);
    buildTopic(clientUsername, DEVICE_0, STATE, device0StateTopic, MAX_TOPIC_SIZE);
    buildTopic(clientUsername, DEVICE_0, CMD, device0CmdTopic, MAX_TOPIC_SIZE);

    // Build device 1 topics
    buildTopic(clientUsername, DEVICE_1, CONFIG, device1ConfigTopic, MAX_TOPIC_SIZE);
    buildTopic(clientUsername, DEVICE_1, STATE, device1StateTopic, MAX_TOPIC_SIZE);
    buildTopic(clientUsername, DEVICE_1, CMD, device1CmdTopic, MAX_TOPIC_SIZE);

    // Subscribe to config and cmd topics
    subscribePubSubClient(device0ConfigTopic);
    subscribePubSubClient(device0CmdTopic);
    subscribePubSubClient(device1ConfigTopic);
    subscribePubSubClient(device1CmdTopic);
  }
  else /* All other cases assume a connection to wifi. */
  {
    if (device0.enabled && device0.publish && digitalRead(pubSwitch) == HIGH)
    {
      // TODO publish device zero
      // Publish new state for device 1
      byte *payload = (byte *)&device0.value;
      if (pubSubClient.publish(device0StateTopic, payload, 4, true))
      {
        // Blink LED to indicate successful publish
        digitalWrite(recvLED, HIGH);
        delay(LEDDelayPeriod);
        digitalWrite(recvLED, LOW);
        delay(LEDDelayPeriod);
        device0.publish = false;
      }
      else
      {
        Serial.println("Failed to publish new state for device 0");
      }
    }

    pubSubClient.loop();
  }

  delay(250);
}

void callback(char *topic, byte *payload, unsigned int length)
{
  if (strcmp(topic, device0ConfigTopic) == 0 || strcmp(topic, device1ConfigTopic) == 0)
  {
    aom_iot_controller_ControllerMessage controllerMessage = aom_iot_controller_ControllerMessage_init_zero;
    pb_istream_t stream = pb_istream_from_buffer(payload, length);
    bool status = pb_decode(&stream, aom_iot_controller_ControllerMessage_fields, &controllerMessage);
    if (!status)
    {
      Serial.print("Failed to decode configuration for ");
      Serial.println(topic);
      Serial.print("Decoding error: ");
      Serial.println(PB_GET_ERROR(&stream));
    }
    else
    {
      if (controllerMessage.device.number == 0)
      {
        configureDevice(&device0, &controllerMessage, device0ISR);
      }
      if (controllerMessage.device.number == 1)
      {
        configureDevice(&device1, &controllerMessage, NULL);
      }
    }
  }

  /* Only update output if switch is enabled*/
  if (digitalRead(recvSwitch) == HIGH && strcmp(topic, device1CmdTopic) == 0)
  {
    // Set device 1 output
    uint32_t payloadValue = 0;
    for (unsigned int i = 0; i < length; i++)
    {
      payloadValue += *(payload + i) << (8 * i);
    }
    bool output = payloadValue;
    if (device1.enabled)
    {
      digitalWrite(device1.pin, output);
    }

    // Publish new state for device 1
    byte *newPayload = (byte *)&output;
    if (!pubSubClient.publish(device1StateTopic, newPayload, 1, true))
    {
      Serial.println("Failed to publish new state for device 1");
    }

    // Blink LED to indicate message successfully received
    digitalWrite(recvLED, HIGH);
    delay(LEDDelayPeriod);
    digitalWrite(recvLED, LOW);
    delay(LEDDelayPeriod);
  }
}

void device0ISR()
{
  device0.value = digitalRead(device0.pin);
  device0.publish = true;
}
