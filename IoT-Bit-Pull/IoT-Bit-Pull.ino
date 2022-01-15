
/*
 * 
  Adapted from @avilmaru

  Will use task creation/deletion on AOM Google Tasks to trigger a TASK_CREATED or TASK_COMPLETED message 
 */

#include <ArduinoJson.h>  


/////////////////////////
#include <WiFiNINA.h>
#include "arduino_secrets_mine.h" 

char ssid[] = SECRET_SSID;         // your network SSID (name)
char pass[] = SECRET_PASS;         // your network password (use for WPA, or use as key for WEP)
int status = WL_IDLE_STATUS;
char server[] = "io.adafruit.com"; // name address for Adafruit IOT Cloud

///////////////////////////

// Initialize the client library
WiFiClient client;

int state = 2;
int digi_pin = 0;

void setup() {

  Serial.begin(9600);
  //while (!Serial);   // wait for serial port to connect. Needed for native USB port only
  
  pinMode(digi_pin, OUTPUT);     // Relay
      
  ConectToWIFI();
  
}

void loop() {

    httpRequest();
    if (state == 1)  {
      digitalWrite(digi_pin, HIGH);   //Turn on light
      //Serial.println("Drove HIGH");
    }
    else if (state == 0)
      digitalWrite(digi_pin, LOW);   //Turn off light
    else
      digitalWrite(digi_pin, LOW);   //Turn off light

    Serial.println(state);
   // int sensorValue = digitalRead(2);
   // Serial.println(sensorValue);
 
}

// this method makes a HTTP connection to the server:
void httpRequest() 
{

  // JSon
  
/*
 * GET: /api/v2/AOM_IoT/feeds/iot-testing-1-dot-0/data/last
{
  "id": "string",
  "value": "string",
  "feed_id": 0,
  "group_id": 0,
  "expiration": "string",
  "lat": 0,
  "lon": 0,
  "ele": 0,
  "completed_at": "string",
  "created_at": "string",
  "updated_at": "string",
  "created_epoch": 0
}
 */


  // close any connection before send a new request.
  // This will free the socket on the Nina module
  client.stop();

  Serial.println("\nStarting connection to server...");
  if (client.connect(server, 80)) 
  {
    
      Serial.println("connected to server");
      // Make a HTTP request:
      //client.println("GET /api/v2/"IO_USERNAME"/feeds/IoT_Testing_1.0/data/last HTTP/1.1");     //Retrieves 
        client.println("GET /api/v2/"IO_USERNAME"/feeds/"IO_FEED_KEY"/data/last HTTP/1.1");     //Retrieves 
      
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

       if (val == "TASK_COMPLETED") 
          state = 0;   
       else if (val == "TASK_CREATED")
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
