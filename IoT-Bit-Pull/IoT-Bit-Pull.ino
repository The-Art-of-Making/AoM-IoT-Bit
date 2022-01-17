/*
 * Author: Mark Hofmeister 
 * Created: 1/13/2022
 * Last Updated: 1/15/2022
 * Description: This code will use Arduino's MKR WiFi 1010 microcontroller platform to: 
 *              1. Initialize a digital output pin
 *              2. Connect to WiFi through Arduino's WiFiNINA library
 *              3. Report information about the WiFi network to Serial output
 *              4. Send an HTTP request to Adafruit IO's API and retrieve feed data
 *              5. Store Adafruit IO data and control digital pin output based on data values.
 * 
 */

#include <ArduinoJson.h>            //Necessary to make API request 

/////////////////////////
#include <WiFiNINA.h>               //library to connect Arduino to wifi and to Adafruit IO
#include "arduino_secrets_mine.h"   //header file containing private information

char ssid[] = SECRET_SSID;         // your network SSID (name)
char pass[] = SECRET_PASS;         // your network password (use for WPA, or use as key for WEP)
int status = WL_IDLE_STATUS;       // used to report Wifi connectivity information
char server[] = "io.adafruit.com"; // name address for Adafruit IOT Cloud

///////////////////////////

// Initialize the client library. The Arduino is a "client" of the WiFi when it connects to it.
WiFiClient client;

int state = 2;        //Describes state of digital pin output. 0 = LOW, 1 = HIGH, 2 = LOW/unknown/transitive.
int digi_pin = 0;     //Pin to output a value to the Littlebit

void setup() {
  Serial.begin(9600);           //Begins Serial monitor for debugging purposes.
  
  pinMode(digi_pin, OUTPUT);     // commands the digital pin to output a signal, rather than receive one.
      
  ConectToWIFI();               //Function to connect to WiFi, instantiated below.
  
}

void loop() {

    httpRequest();              //Function to request a connection to Adafruit IO, instantiated below.
    
    if (state == 1)  {                                //Adjust digital output depending on state
      digitalWrite(digi_pin, HIGH);   //Turn on light
      //Serial.println("Drove HIGH");
    }
    else if (state == 0)
      digitalWrite(digi_pin, LOW);   //Turn off light
    else
      digitalWrite(digi_pin, LOW);   //Turn off light

    Serial.print("State: ");
    Serial.println(state);
 
}

// this method makes a HTTP connection to the server and communicates with Adafruit IO through Adafruit's API (Application Programming Interface)
void httpRequest() 
{
  
  // close any connection before send a new request.
  // This will free the socket on the Nina module
  client.stop();

  Serial.println("\nStarting connection to server...");
  if (client.connect(server, 80)) 
  {
    
      Serial.println("connected to server");
      
      // Make a HTTP request:
       client.println("GET /api/v2/" IO_USERNAME "/feeds/" IO_FEED_KEY "/data/last HTTP/1.1");     
       //client.println("GET /api/v2/" IO_USERNAME "/feeds/" IO_FEED_KEY "/data/last HTTP/1.1"); 
        
      //Calls Adafruit IO's API to retrieve the last data value recorded in a provided list
      
      client.println("Host: io.adafruit.com");  
      client.println("Connection: close");
      client.println("Content-Type: application/json");  
      client.println("X-AIO-Key: " IO_KEY); 
      
      // Terminate headers with a blank line
      if (client.println() == 0) {
        Serial.println(F("Failed to send request"));
        return;
      }
        
      // Check HTTP status
      char status[32] = {0};
      client.readBytesUntil('\r', status, sizeof(status));
      if (strcmp(status, "HTTP/1.1 200 OK") != 0) {
        Serial.print(F("Unexpected response: "));
        Serial.println(status);
        return;
      }
      
      // Skip HTTP headers
      char endOfHeaders[] = "\r\n\r\n";
      if (!client.find(endOfHeaders)) {
        Serial.println(F("Invalid response1"));
        return;
      }

      // Skip Adafruit headers
      char endOfHeaders2[] = "\r";
      if (!client.find(endOfHeaders2)) {
        Serial.println(F("Invalid response2"));
        return;
      }

      //Deserialize JSon
      const size_t capacity = JSON_OBJECT_SIZE(12) + 170;
      StaticJsonDocument<capacity> doc;

      DeserializationError error = deserializeJson(doc, client);
      if (error) {
        Serial.print(F("deserializeJson() failed: "));
        Serial.println(error.c_str());
        return;
      }
      
      const char* value = doc["value"];
    
      Serial.print("get data: ");
      Serial.println(value);

      String val = String(value);

      

       if (val == LOW_MESSAGE) 
          state = 0;   
       else if (val == HIGH_MESSAGE)
          state = 1;
       else
          state = 2;   
      
  } else {
      // if you couldn't make a connection:
      Serial.println("connection failed");
      state = 2;
  }

}



  

void ConectToWIFI()
{
   // check for the WiFi module:
  if (WiFi.status() == WL_NO_MODULE) {
    Serial.println("Communication with WiFi module failed!");
    // don't continue
    while (true);
  }

  String fv = WiFi.firmwareVersion();
  if (fv < "1.0.0") {
    Serial.println("Please upgrade the firmware");
  }

  // attempt to connect to Wifi network:
  while (status != WL_CONNECTED) {
    Serial.print("Attempting to connect to SSID: ");
    Serial.println(ssid);
    // Connect to WPA/WPA2 network. Change this line if using open or WEP network:
    status = WiFi.begin(ssid, pass);
printWifiStatus();
    // wait 10 seconds for connection:
    delay(10000);
  }
  Serial.println("Connected to wifi");
  printWifiStatus();
}






void printWifiStatus() {
  // print the SSID of the network you're attached to:
  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());

  // print your board's IP address:
  IPAddress ip = WiFi.localIP();
  Serial.print("IP Address: ");
  Serial.println(ip);

  // print the received signal strength:
  long rssi = WiFi.RSSI();
  Serial.print("signal strength (RSSI):");
  Serial.print(rssi);
  Serial.println(" dBm");
}
