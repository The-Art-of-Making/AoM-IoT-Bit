
#include <ArduinoJson.h>  

/////////////////////////
#include <WiFiNINA.h>
#include "arduino_secrets_mine.h" 

char ssid[] = SECRET_SSID;         // your network SSID (name)
char pass[] = SECRET_PASS;         // your network password (use for WPA, or use as key for WEP)
int status = WL_IDLE_STATUS;
char server[] = "io.adafruit.com"; // name address for Adafruit IOT Cloud

unsigned long lastConnectionTime = 0;              // last time you connected to the server, in milliseconds
const unsigned long postingInterval = 7000;       // delay between updates, in milliseconds
int state = 2;
int digi_pin = 0;
int light_pin = 1;

// Initialize the client library
WiFiClient client;

void setup() {
 
  Serial.begin(9600);
  //while (!Serial); // wait for serial port to connect. Needed for native USB port only

  pinMode(digi_pin, INPUT);
  pinMode(light_pin, OUTPUT);

  connectToWIFI();
 
}

void loop() {

 // if 7 seconds have passed since your last connection,
  // then connect again and send data:
  if (millis() - lastConnectionTime > postingInterval) 
  {
    state = digitalRead(digi_pin);

    
    
    httpRequest(); // send data to Cloud
  }
  
}


/* 
 * This method makes a HTTP connection to the server and post deread sensor values 
 * to the Adafruit IOT Cloud
 */


void httpRequest() 
{

  
/*
 * https://io.adafruit.com/api/docs/#operation/createGroupData
 * 
 * POST /{username}/groups/{group_key}/data
 * 
 * JSON:
 * 
{
  "location": {
    "lat": 0,
    "lon": 0,
    "ele": 0
  },
  "feeds": [
    {
      "key": "string",
      "value": "string"
    }
  ],
  "created_at": "string"
}
 */

 String strToUpload;
  if (state == 0) {
      strToUpload = "Light OFF";
      digitalWrite(light_pin, HIGH);
    } else if (state == 1) {
      strToUpload = "Light ON";
      digitalWrite(light_pin, LOW);
    } else {
      strToUpload = "Light...unknown?";
    }

  const size_t capacity = JSON_ARRAY_SIZE(3) + 3*JSON_OBJECT_SIZE(2) + 2*JSON_OBJECT_SIZE(3) + 130;
  StaticJsonDocument<capacity> doc;

   // Add the "location" object
  JsonObject location = doc.createNestedObject("location");
  location["lat"] = 0;
  location["lon"] = 0;
  location["ele"] = 0;
  
  JsonArray feeds = doc.createNestedArray("feeds");
  JsonObject feed1 = feeds.createNestedObject();
  feed1["key"] = "IoT_Testing_Push_2.0"; 
  feed1["value"] = strToUpload;

  Serial.print(strToUpload);
  
  // close any connection before send a new request.
  // This will free the socket on the Nina module
  client.stop();

  Serial.println("\nStarting connection to server...");
  if (client.connect(server, 80)) 
  {
    Serial.println("connected to server");
    // Make a HTTP request:
    client.println("POST /api/v2/" IO_USERNAME "/groups/" IO_GROUP "/data HTTP/1.1"); 
    client.println("Host: io.adafruit.com");  
    client.println("Connection: close");  
    client.print("Content-Length: ");  
    client.println(measureJson(doc));  
    client.println("Content-Type: application/json");  
    client.println("X-AIO-Key: " IO_KEY); 

    // Terminate headers with a blank line
    client.println();
    // Send JSON document in body
    serializeJson(doc, client);

    // note the time that the connection was made:
    lastConnectionTime = millis();

    Serial.println("data sent!");
    
  } else {
    // if you couldn't make a connection:
    Serial.println("connection failed!");
  }

  
}



void connectToWIFI()
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

    // wait 10 seconds for connection:
    delay(10000);
  }

  Serial.println("Connected to wifi");
  delay(2000);
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
