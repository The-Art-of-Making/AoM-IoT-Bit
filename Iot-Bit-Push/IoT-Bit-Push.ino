/*
 * Author: Mark Hofmeister 
 * Created: 1/13/2022
 * Last Updated: 1/15/2022
 * Description: This code will use Arduino's MKR WiFi 1010 microcontroller platform to: 
 *              1. Initialize a digital output pin
 *              2. Connect to WiFi through Arduino's WiFiNINA library
 *              3. Report information about the WiFi network to Serial output
 *              4. Send an HTTP request to Adafruit IO's API and push data to a feed in a group
 *              5. Store Adafruit IO data and control digital pin output based on data values.
 * 
 */

#include <ArduinoJson.h>            //Necessary to make API request 

/////////////////////////
#include <WiFiNINA.h>
#include "arduino_secrets_mine.h" 

char ssid[] = SECRET_SSID;         // your network SSID (name)
char pass[] = SECRET_PASS;         // your network password (use for WPA, or use as key for WEP)
int status = WL_IDLE_STATUS;       // used to report Wifi connectivity information
char server[] = "io.adafruit.com"; // name address for Adafruit IOT Cloud

unsigned long lastConnectionTime = 0;              // last time you connected to the server, in milliseconds
const unsigned long postingInterval = 10000;       // delay between updates, in milliseconds

int state = 2;        //Describes state of digital pin output. 0 = LOW, 1 = HIGH, 2 = LOW/unknown/transitive.
int digi_pin = 0;     //Pin to output a value to the Littlebit
int light_pin = 1;    //Pin to output signal to external LED, reflecting HIGH or LOW digi_pin output.

// Initialize the client library
WiFiClient client;

void setup() {
 
  Serial.begin(9600);
  //while (!Serial); // wait for serial port to connect. Needed for native USB port only

  pinMode(digi_pin, INPUT);       //assign pins to be either inputs to be read or voltage outputs
  pinMode(light_pin, OUTPUT);

  connectToWIFI();                //Function to connect to WiFi, instantiated below.
 
}

void loop() {

 // if 10 seconds have passed since your last connection,
  // then connect again and send data:
  if (millis() - lastConnectionTime > postingInterval)          
  {
    state = digitalRead(digi_pin);
    httpRequest(); //Function to request a connection to Adafruit IO, instantiated below.
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
      strToUpload = LOW_MESSAGE;
      digitalWrite(light_pin, HIGH);
    } else if (state == 1) {
      strToUpload = HIGH_MESSAGE;
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
  
  JsonArray feeds = doc.createNestedArray("feeds");       //Create JSON nested array for group
  JsonObject feed1 = feeds.createNestedObject();          //Fill first array index with feed1 
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

    //Calls Adafruit IO's API to upload the string decided by the conditional 
    
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
