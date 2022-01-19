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

   /* If no activity for an entire posting interval, retry */
    if (millis() - lastConnectionTime > postingInterval)          
    {
      
      /* Read state from pin */
      state = digitalRead(pin_in_value);
      
      /* Set local light based on state O */
      if (state == 0) 
      {
        digitalWrite(pin_in_light, HIGH);
        message = low_message;
      } 
      else if (state == 1) 
      {
        digitalWrite(pin_in_light, LOW);
        message = high_message;
      }
      else
      {
        message = "UNKNOWN";
      }

      /* Request a connection to Adafruit IO */
      if (httpRequest(message))
      {
        /* Note the time that the connection was made */
        lastConnectionTime = millis();
        Serial.println("Data upload suceeded!");
      }
      else
      {
        /* if you couldn't make a connection */
        Serial.println("Data upload failed!");
      }
    }
    
}
