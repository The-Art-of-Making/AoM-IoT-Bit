#include <ArduinoJson.h>                            // Necessary to make API request 
#include <WiFiNINA.h>                               // Library to connect Arduino to wifi and to Adafruit IO
#include "MicroSD_IO.h"                                 // Header file for SD Card IO setup

char ssid[]      = SECRET_SSID;                     // Your network SSID (name)
char pass[]      = SECRET_PASS;                     // Your network password (use for WPA, or use as key for WEP)
int wifi_status  = WL_IDLE_STATUS;                  // Used to report Wifi connectivity information
char server[]    = "io.adafruit.com";               // Name address for Adafruit IOT Cloud

WiFiClient client;                                  // Initialize the client library

bool initializeCredentials()
{
    /* Attempt to read from secrets.txt */
    String secrets = readfromFile(String "secrets.txt");
    
    if (secrets == "NULL")
    {
      return false;
    }

    /* Todo For Mark */
    
}

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
bool wifi_connected()
{
  wifi_status = WiFi.status();
  return (wifi_status == WL_CONNECTED);
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

    /* Attempt to connect to the Wifi network 3 times */
    int attempt_count = 0;
    while ((wifi_status != WL_CONNECTED) && (attempt_count < 3))
    {
      attempt_count += 1;
      
      Serial.println("Attempt (" + String(attempt_count) + ") to connect to Wifi Network @ SSID: " + String(ssid) +"...");
      
      /* Connect to WPA/WPA2 network. NOTE: Change this line if using open or WEP network */
      wifi_status = WiFi.begin(ssid, pass);

      /* Wait 10 seconds for connection */
      delay(10000);
    }

    if (attempt_count <= 3)
    {
      Serial.println("Sucessfully connected to Wifi Network @ SSID: " + String(ssid) + "!");
      printWifiStatus();
      return true;
    }
    else
    {
      Serial.println("Failed to connect to Wifi Network @ SSID: " + String(ssid) + "!");
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
      Serial.println("Disconnecting from Wifi @ SSID: " + String(ssid) +"...");
      
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
        char wifi_status[32] = {0};
        client.readBytesUntil('\r', wifi_status, sizeof(wifi_status));
        if (strcmp(wifi_status, "HTTP/1.1 200 OK") != 0)
        {
          Serial.print(F("Unexpected response: "));
          Serial.println(wifi_status);
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
