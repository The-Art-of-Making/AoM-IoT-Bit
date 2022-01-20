/*
 * Authors: Mark Hofmeister, Issam Abushaban
 * Created: 1/19/2022
 * Last Updated: 1/19/2022
 * Description: This code will use Arduino's MKR WiFi 1010 microcontroller platform to: 
 *              1.
 * 
 */

#include "Wifi_Setup.h"                             // Header file for wifi setup functions

int state           = 2;                            // Describes state of digital pin output. 0 = LOW, 1 = HIGH, 2 = LOW/unknown/transitive.
int pin_in_value    = 0;                            // 
int pin_in_light    = 1;                            // 
int pin_out_value   = 6;                            // 
int pin_out_light   = 7;                            // 
String low_message  = "LOW";                        //
String high_message = "HIGH";                       //
String message      = "UNKNOWN";                    //

void setup()
{
    /* Begins Serial monitor for debugging purposes. */
    Serial.begin(9600);

    /* while the serial stream is not open, do nothing */
    while (!Serial);
    
    /* Set all pin modes */
    pinMode(pin_in_value,  INPUT);
    pinMode(pin_in_light,  OUTPUT);
    pinMode(pin_out_value, INPUT);
    pinMode(pin_out_light, OUTPUT);


    Serial.println("Initializing connection to WIFI...");

    /* Connect to WiFi */
    connectToWIFI();                               

}

void loop()
{

    /* Request a connection to Adafruit IO and ask for a GET request */
    String recieved_message = http_Request_GET();
    
    if (recieved_message != "NULL")
    {
      /* Note the time that the connection was made */
      Serial.println("Data download suceeded!");
    }
    else
    {
      /* if you couldn't make a connection */
      Serial.println("Data download failed!");
    }

    Serial.println("Recieved message: " + recieved_message);
    
    /* Set local light based on state O */
    if (recieved_message == low_message) 
    {
      digitalWrite(pin_in_light, HIGH);
    } 
    else if (recieved_message == high_message) 
    {
      digitalWrite(pin_in_light, LOW);
    }

}
