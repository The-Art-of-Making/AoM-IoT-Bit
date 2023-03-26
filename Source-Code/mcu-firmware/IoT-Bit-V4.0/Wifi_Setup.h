#include <string.h>
#include <stdio.h>
#include <stdlib.h>

#include <WiFiNINA.h>     // Library to connect Arduino to wifi
#include <Ethernet.h>     // Needed to create IPAddress for server
#include <PubSubClient.h> // Library to connect to MQTT server

#include "MicroSD_IO.h" // Header file for SD Card IO setup

#define SECRETS_BUFFER_SIZE 508

char secretsBuffer[SECRETS_BUFFER_SIZE]; // Total length of Wifi SSID and Password must not exceed 400

// SD card info
const char *wifiSSID;       // Your network SSID (name)
const char *wifiPassword;   // Your network password (use for WPA, or use as key for WEP)
const char *clientUsername; // Username to connect to MQTT server
const char *clientPassword; // Password to connect to MQTT server

WiFiClient client; // Initialize the client library
int wifiStatus;    // Used to report Wifi connectivity information

uint16_t port = 1883; // MQTT reverse proxy port
IPAddress server(143, 42, 127, 125);

const char topicLevels[3][7] = {"config", "state", "cmd"};

typedef enum
{
  CONFIG = 0,
  STATE,
  CMD
} TopicLevel;

typedef enum
{
  DEVICE_0 = 0,
  DEVICE_1
} DeviceNumber;

uint16_t bufferSize = 1024;

PubSubClient pubSubClient(server, port, client);

// Read credentials from SD card
bool initializeCredentials()
{
  /* Attempt to read from secrets.txt */
  String secrets = readfromFile("secrets.txt");
  Serial.println("secrets.txt contents read: " + secrets);

  if (secrets == "NULL")
  {
    return false;
  }

  /* The expected contents of the secrets.txt file should look like this: */
  /* Format:  WIFI_SSID;WIFI_PASSWORD;CLIENT_USERNAME;CLIENT_PASSWORD */
  /* Example: iPhone;password;client-c7c3599a-2e70-4f20-a4e1-7a6477e8f858;04d4d7a0510959e27460c9434adc9b6cd484de68ae26e438abc819e9785d6127 */

  /* Split the data into its parts */

  /* Buffer for security */
  secrets.toCharArray(secretsBuffer, SECRETS_BUFFER_SIZE);

  char *splitValue;

  /* For only the first split, specify the char array to use */
  splitValue = strtok(secretsBuffer, ";");
  if (splitValue == NULL)
  {
    Serial.println("Cannot Split: failed to parse wifi ssid");
    return false;
  }
  wifiSSID = splitValue;

  /* The splitter continues using the secretsBuffer */
  splitValue = strtok(NULL, ";");
  if (splitValue == NULL)
  {
    Serial.println("Cannot Split: failed to parse wifi password");
    return false;
  }
  wifiPassword = splitValue;

  /* The splitter continues using the secretsBuffer */
  splitValue = strtok(NULL, ";");
  if (splitValue == NULL)
  {
    Serial.println("Cannot Split: failed to parse client username");
    return false;
  }
  clientUsername = splitValue;

  /* The splitter continues using the secretsBuffer */
  splitValue = strtok(NULL, ";");
  if (splitValue == NULL)
  {
    Serial.println("Cannot Split: failed to parse client password");
    return false;
  }
  clientPassword = splitValue;

  return true;
}

void printWifiStatus()
{
  Serial.println("");

  Serial.println("**Current Wifi Status");

  /* Print the SSID of the network you're attached to */
  Serial.print("****SSID: ");
  Serial.println(WiFi.SSID());

  /* Print your board's IP address */
  Serial.print("****IP Address: ");
  Serial.println(WiFi.localIP());

  /* Print the received signal strength */
  Serial.print("****signal strength (RSSI):");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");

  Serial.println("");
}

bool wifiConnected()
{
  wifiStatus = WiFi.status();
  return (wifiStatus == WL_CONNECTED);
}

bool connectToWIFI()
{
  /* Check for the WiFi module */
  if (WiFi.status() == WL_NO_MODULE)
  {
    Serial.println("Communication with WiFi module failed!");
    return false;
  }

  /* Check firmware version */
  String fv = WiFi.firmwareVersion();
  if (fv < "1.0.0")
  {
    Serial.println("Please upgrade the firmware");
    return false;
  }

  /* Attempt to connect to the Wifi network 1 time */
  int attempt_count = 0;
  while ((wifiStatus != WL_CONNECTED) && (attempt_count < 3))
  {
    attempt_count += 1;

    Serial.print("Attempt (" + String(attempt_count) + ") to connect to Wifi Network @ SSID: ");
    Serial.write(wifiSSID);
    Serial.println("...");

    /* Connect to WPA/WPA2 network. NOTE: Change the next lines if using open or WEP network */

    wifiStatus = WiFi.begin(wifiSSID, wifiPassword);

    /* Wait 10 seconds for connection */
    delay(10000);
  }

  if (attempt_count < 3)
  {
    char buf[50 + strlen(wifiSSID)];
    strcpy(buf, "Successfully connected to Wifi Network @ SSID: ");
    strcat(buf, wifiSSID);
    strcat(buf, "\n");
    Serial.write(buf);
    printWifiStatus();
    return true;
  }
  else
  {
    char buf[44 + strlen(wifiSSID)];
    strcpy(buf, "Failed to connect to Wifi Network @ SSID: ");
    strcat(buf, wifiSSID);
    strcat(buf, "\n");
    Serial.write(buf);
    return false;
  }
}

bool disconnectFromWIFI()
{
  bool response = false;

  /* Check for the WiFi module */
  if (WiFi.status() == WL_NO_MODULE)
  {
    Serial.println("Communication with WiFi module failed!");
    response = false;
  }

  /* Check firmware version */
  String fv = WiFi.firmwareVersion();
  if (fv < "1.0.0")
  {
    Serial.println("Please upgrade the firmware");
    response = false;
  }

  /* Keep attempting to connect to the Wifi network */
  if (WiFi.status() == WL_CONNECTED)
  {
    char buf[37 + strlen(wifiSSID)];
    strcpy(buf, "Disconnecting from Wifi @ SSID: ");
    strcat(buf, wifiSSID);
    strcat(buf, "...\n");
    Serial.write(buf);

    WiFi.end();
    response = true;
  }
  else
  {
    response = false;
  }

  /* Wait 1 seconds to report */
  delay(1000);

  return response;
}

bool connectPubSubClient(MQTT_CALLBACK_SIGNATURE)
{
  pubSubClient.setCallback(callback);
  bool success = pubSubClient.connect(clientUsername, clientUsername, clientPassword);
  if (success)
  {
    Serial.println("PubSub client successfully connected to MQTT server");
  }
  else
  {
    int state = pubSubClient.state();
    Serial.println();
    Serial.print("PubSub client failed to connect to MQTT server with code ");
    Serial.println(state);
    Serial.println();
    delay(5000);
  }
  return success;
}

void disconnectPubSubClient()
{
  Serial.println("Disconnecting PubSub client from MQTT server");
  pubSubClient.disconnect();
}

// Build topic in the form of /<Client Username>/devices/<Device>/<Topic Level>
bool buildTopic(const char *username, DeviceNumber deviceNumber, TopicLevel topicLevel, char topicBuffer[], size_t maxSize)
{
  // Get topic size
  size_t size = strlen(clientUsername) + strlen(topicLevels[topicLevel]) + 13;
  if (size > maxSize)
  {
    Serial.println("Topic size exceeds max size");
    return false;
  }

  // Build topic
  char *topic = (char *)malloc(size);
  strcpy(topic, "/");
  strcat(topic, clientUsername);
  strcat(topic, "/devices/");
  char device[2];
  snprintf(device, sizeof(device), "%d", deviceNumber);
  strcat(topic, device);
  strcat(topic, "/");
  strcat(topic, topicLevels[topicLevel]);

  // Copy topic to topic buffer
  snprintf(topicBuffer, maxSize, "%s", topic);
  free(topic);

  return true;
}

// Subscribe to topic
bool subscribePubSubClient(char *topic)
{
  char buf[26 + strlen(topic)];
  strcpy(buf, "Subscribing to topic ");
  strcat(buf, topic);
  strcat(buf, "...\n");
  Serial.write(buf);
  bool success = pubSubClient.subscribe(topic);
  if (success)
  {
    Serial.println("Subscription successful");
  }
  else
  {
    Serial.println("Subscription failed");
  }
  Serial.println();

  return success;
}
