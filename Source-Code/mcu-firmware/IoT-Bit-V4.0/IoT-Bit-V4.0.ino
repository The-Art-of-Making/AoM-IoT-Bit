/*
 * Authors: Mark Hofmeister, Issam Abushaban, Benjamin Esquieres
 * Created: 7/30/2022
 * Last Updated: 03/20/2023
 * Version: V4.0
 *
 */

#include "Wifi_Setup.h" // Header file for wifi setup functions

/* SD card attached to SPI bus as follows, do not use these pins
 *  MOSI  - pin 11
 *  MISO  - pin 12
 *  CLK   - pin 13
 *  CS    - pin  4
 */

int wifiStatusLED = 6; // The pin for outputing the wifi connection status to an LED

int outputPin = 1; // The pin for writing the output signal
int inputPin = 0;  // The pin for reading the input signal

int pubSwitch = A1;  // The pin for reading the PUB switch status
int recvSwitch = A2; // The pin for reading the RECV switch status

int pubLED = A3;  // The pin for outputing the POST status to an LED
int recvLED = A6; // The pin for outputing the GET status to an LED

unsigned long LEDDelayPeriod = 500;

bool publish = false;

void setup()
{
  /* Begins Serial monitor for debugging purposes. */
  Serial.begin(9600);

  /* Set all pin modes */
  pinMode(inputPin, INPUT);
  pinMode(outputPin, OUTPUT);

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

    /* Give Them 3 seconds */
    Serial.print("Checking For SD card in...");
    /*Serial.print("5...");
    delay(1000);
    Serial.print("4...");
    delay(1000);*/
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

  /*
   * Interrupts
   * - publishISR = triggered whenever the input signal value changes state
   */
  attachInterrupt(digitalPinToInterrupt(inputPin), publishISR, CHANGE);
}

void loop()
{
  Serial.print("\Receive Mode Switch: ");
  Serial.println(digitalRead(recvSwitch));
  Serial.print("Publish Mode Switch: ");
  Serial.println(digitalRead(pubSwitch));

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
    // Subscribe to config and cmd topics
    subscribePubSubClient(clientUsername, DEVICE_0, CONFIG);
    subscribePubSubClient(clientUsername, DEVICE_0, CMD);
    subscribePubSubClient(clientUsername, DEVICE_1, CONFIG);
    subscribePubSubClient(clientUsername, DEVICE_1, CMD);
  }
  else /* All other cases assume a connection to wifi. */
  {
    // TODO publish/receive messages
    publishMsg();
    pubSubClient.loop();
  }

  delay(250);
}

void callback(char* topic, byte* payload, unsigned int length)
{
  Serial.println(topic);
  // TODO device configuration
  // TODO update outputs
  // Blink LED to indicate message successfully received
  digitalWrite(recvLED, HIGH);
  delay(LEDDelayPeriod);
  digitalWrite(recvLED, LOW);
  delay(LEDDelayPeriod);
}

// TODO publish to state topic
void publishMsg()
{
  if (publish)
  {
    // Report publish status, blink LED if successful
    if (true)
    {
      // Blink LED to indicate successful publish
      digitalWrite(recvLED, HIGH);
      delay(LEDDelayPeriod);
      digitalWrite(recvLED, LOW);
      delay(LEDDelayPeriod);

      publish = false;
    }
  }
}

void publishISR()
{
  /* Only publish if publish switch is enabled*/
  if (digitalRead(pubSwitch) == HIGH)
  {
    publish = true;
  }
}
