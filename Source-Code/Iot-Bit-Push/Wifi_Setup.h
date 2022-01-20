#include <ArduinoJson.h>                            // Necessary to make API request 
#include <WiFiNINA.h>                               // Library to connect Arduino to wifi and to Adafruit IO
#include "arduino_secrets_mine.h"                   // Header file containing private information

char ssid[]   = SECRET_SSID;                        // Your network SSID (name)
char pass[]   = SECRET_PASS;                        // Your network password (use for WPA, or use as key for WEP)
int status    = WL_IDLE_STATUS;                     // Used to report Wifi connectivity information
char server[] = "io.adafruit.com";                  // Name address for Adafruit IOT Cloud

unsigned long lastConnectionTime    = 0;            // Last time you connected to the server, in milliseconds
const unsigned long postingInterval = 2000;         // Delay between updates, in milliseconds

WiFiClient client;                                  // Initialize the client library


void printWifiStatus() 
{
    Serial.println("Current Wifi Status:");
    
    /* Print the SSID of the network you're attached to */
    Serial.print("SSID: ");
    Serial.println(WiFi.SSID());
  
    /* Print your board's IP address */
    IPAddress ip = WiFi.localIP();
    Serial.print("IP Address: ");
    Serial.println(ip);
  
    /* Print the received signal strength */
    long rssi = WiFi.RSSI();
    Serial.print("signal strength (RSSI):");
    Serial.print(rssi);
    Serial.println(" dBm");
    
    Serial.println("");
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
  
    /* Keep attempting to connect to the Wifi network */
    while (status != WL_CONNECTED)
    {
      Serial.println("Attempting to connect to Wifi Network @ SSID: " + String(ssid) +"...");
      
      /* Connect to WPA/WPA2 network. NOTE: Change this line if using open or WEP network */
      status = WiFi.begin(ssid, pass);
  
      /* Wait 10 seconds for connection */
      delay(10000);
    }
    
    Serial.println("Sucessfully connected to Wifi Network @ SSID: " + String(ssid) + "!");
    
    printWifiStatus();
}



String http_Request_GET()
{

    /* Close any connection before send a new request. This will free the socket on the Nina module. */
    client.stop();
    
    Serial.println("");
    Serial.println("Attempting to connect to cloud server " + String(server) + "...");
    
    if (client.connect(server, 80)) 
    {
        Serial.println("Sucessfully connected to server " + String(server) + "!");
  
        Serial.println("Attempting to get message...");
        
        /* Make a HTTP request */
        client.println("GET /api/v2/" + String(IO_USERNAME) + "/feeds/" + String(IO_FEED_KEY) + "/data/last HTTP/1.1");     
          
        /* Calls Adafruit IO's API to retrieve the last data value recorded in a provided list */
        client.println("Host: " + String(server));
        client.println("Connection: close");
        client.println("Content-Type: application/json");  
        client.println("X-AIO-Key: " IO_KEY); 
        
        /* Terminate headers with a blank line */
        if (client.println() == 0)
        {
          Serial.println(F("Failed to send request"));
          return "NULL";
        }
          
        /* Check HTTP status */
        char status[32] = {0};
        client.readBytesUntil('\r', status, sizeof(status));
        if (strcmp(status, "HTTP/1.1 200 OK") != 0)
        {
          Serial.print(F("Unexpected response: "));
          Serial.println(status);
          return "NULL";
        }
        
        /* Skip HTTP headers */
        char endOfHeaders[] = "\r\n\r\n";
        if (!client.find(endOfHeaders)) {
          Serial.println(F("Invalid response1"));
          return "NULL";
        }
    
        /* Skip Adafruit headers */
        char endOfHeaders2[] = "\r";
        if (!client.find(endOfHeaders2)) {
          Serial.println(F("Invalid response2"));
          return "NULL";
        }
    
        /* Deserialize JSON */
        const size_t capacity = JSON_OBJECT_SIZE(12) + 170;
        
        /* The JSON Document to Deserialize*/
        StaticJsonDocument<capacity> doc;

        DeserializationError deserializationError = deserializeJson(doc, client);
        
        if (deserializationError) {
          Serial.print(F("deserializeJson() failed: "));
          Serial.println(deserializationError.c_str());
          return "NULL";
        }
        
        const char* value = doc["value"];
        String val = String(value);
    
        return val;
    }
    else
    {
        return "NULL";
    }

}

bool http_Request_POST(String message)
{
    const size_t capacity = JSON_ARRAY_SIZE(3) + 3*JSON_OBJECT_SIZE(2) + 2*JSON_OBJECT_SIZE(3) + 130;

    /* Create the JSON Document */
    StaticJsonDocument<capacity> doc;
  
    /* Add the "location" object */
    JsonObject location = doc.createNestedObject("location");
    location["lat"] = 0;
    location["lon"] = 0;
    location["ele"] = 0;
    
    /* Create JSON nested array for group */
    JsonArray feeds = doc.createNestedArray("feeds");
    
    /* Fill first array index with feed1 */
    JsonObject feed1 = feeds.createNestedObject();
    feed1["key"] = "IoT_Testing_1.0";
    feed1["value"] = message;

    /* Close any connection before send a new request. This will free the socket on the Nina module. */
    client.stop();
    
    Serial.println("");
    Serial.println("Attempting to connect to cloud server " + String(server) + "...");
    
    if (client.connect(server, 80)) 
    {
      Serial.println("Sucessfully connected to server " + String(server) + "!");

      Serial.println("Attempting to send message: " + message);
      
      /* Make a HTTP request */
      client.println("POST /api/v2/" + String(IO_USERNAME) + "/groups/" + String(IO_GROUP) + "/data HTTP/1.1"); 
  
      /* Calls Adafruit IO's API to upload the string decided by the conditional */
      client.println("Host: " + String(server));
      client.println("Connection: close");
      client.print("Content-Length: ");
      client.println(measureJson(doc));
      client.println("Content-Type: application/json");  
      client.println("X-AIO-Key: " IO_KEY);
  
      /* Terminate headers with a blank line */
      client.println();
      
      /* Send JSON document in body */
      serializeJson(doc, client);

      return true;
    }
    else 
    {
      return false;
    }

}

bool httpRequest_Multiple(String messages[]) {
  
    /*
     * https://io.adafruit.com/api/docs/#operation/createGroupData
     * 
     * POST /{username}/groups/{group_key}/data
     * 
     * JSON:
     * 
     *  {
     *    "location": {
     *      "lat": 0,
     *      "lon": 0,
     *      "ele": 0
     *    },
     *   "feeds": [
     *     {
     *       "key": "string",
     *       "value": "string"
     *     }
     *   ],
     *   "created_at": "string"
     *  }
     *  
     */
  return false;
}
