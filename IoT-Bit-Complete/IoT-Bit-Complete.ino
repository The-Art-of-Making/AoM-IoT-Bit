/*
 * Authors: Mark Hofmeister, Issam Abushaban
 * Created: 1/19/2022
 * Last Updated: 1/19/2022
 * Description: This code will use Arduino's MKR WiFi 1010 microcontroller platform to: 
 *              1.
 * 
 */

#include "Wifi_Setup.h"                                 // Header file for wifi setup functions

int pin_potentiometer   = A6;                           // The pin for the anolog input of the potentiometer
int pin_post_mode_swt   = 2;                            // The pin for reading the POST switch status
int pin_get_mode_swt    = 3;                            // The pin for reading the GET switch status
int pin_in_value        = 0;                            // The pin for reading the message_to_send digital value
int pin_in_light        = 6;                            // The pin for outputing the pin_in_value to an LED
int pin_out_value       = 1;                            // The pin for writing the message_recieved digital value
int pin_out_light       = 7;                            // The pin for outputing the pin_out_value to an LED

String low_message      = "LOW";                        // The message sent that represents a low digital signal
String high_message     = "HIGH";                       // The message sent that represents a high digital signal
String message_to_send  = "UNKNOWN";                    // The message to be sent
String message_recieved = "UNKNOWN";                    // The message recieved

unsigned long lastConnectionTime = 0;                   // Last time you connected to the server, in milliseconds
unsigned long postingInterval    = 2000;                // Delay between updates, in milliseconds

void setup()
{
    /* Begins Serial monitor for debugging purposes. */
    Serial.begin(9600);

    /* while the serial stream is not open, do nothing */
    //while (!Serial);
    
    /* Set all pin modes */
    pinMode(pin_post_mode_swt, INPUT);
    pinMode(pin_get_mode_swt,  INPUT);
    pinMode(pin_in_value,      INPUT);
    pinMode(pin_in_light,      OUTPUT);
    pinMode(pin_out_value,     OUTPUT);
    pinMode(pin_out_light,     OUTPUT);


    Serial.println("Initializing connection to WIFI...");

    delay(postingInterval);
    
    /* Connect to WiFi */
    connectToWIFI();                               

}

void loop()
{
    /* Set the posting/polling interval based on the potentiometer if both switches are off [As of 01/19/22 range is 2 - 60 seconds] */
    Serial.println("\nPost-Poll Interval: " + String(postingInterval/1000) + "s");
    
    if ((digitalRead(pin_post_mode_swt) == LOW) && (digitalRead(pin_get_mode_swt) == LOW))
    { 
      set_posting_interval();
      delay(1000);
    }
    else
    {
      /* Determine the switch state and if the device should POST. */
      if (digitalRead(pin_post_mode_swt) == HIGH)
      {
        message_POST();
        delay(postingInterval);
      }
      
      /* Determine the switch state and if the device should GET. */    
      if (digitalRead(pin_get_mode_swt) == HIGH)
      {
        message_GET();
        delay(postingInterval);
      }
    }
}

void set_posting_interval()
{
    /* Read the anolog value from potentiometer */
    int potentiometer_value = analogRead(pin_potentiometer);
  
    postingInterval = map(potentiometer_value, 0, 1023, 2000, 60000);
}

void message_POST()
{
    /* If no activity for an entire posting interval, retry */
    while (millis() - lastConnectionTime > postingInterval)          
    {
      
      /* Read state from pin */
      int pin_state = digitalRead(pin_in_value);
      
      /* Set local light based on state O */
      if (pin_state == 0) 
      {
        digitalWrite(pin_in_light, LOW);
        message_to_send = low_message;
      } 
      else if (pin_state == 1) 
      {
        digitalWrite(pin_in_light, HIGH);
        message_to_send = high_message;
      }
      else
      {
        message_to_send = "UNKNOWN";
      }

      /* Request a connection to Adafruit IO */
      if (http_Request_POST(message_to_send))
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

void message_GET()
{
    /* Request a connection to Adafruit IO and ask for a GET request */
    message_recieved = http_Request_GET();
    
    if (message_recieved != "NULL")
    {
      /* Note the time that the connection was made */
      Serial.println("Data download succeeded!");
    }
    else
    {
      /* if you couldn't make a connection */
      Serial.println("Data download failed!");
    }

    Serial.println("Recieved message: " + message_recieved);
    
    /* Set local light */
    if (message_recieved == high_message)
    {
      digitalWrite(pin_out_value, HIGH);
      digitalWrite(pin_out_light, HIGH);
    } 
    else if (message_recieved == low_message) 
    {
      digitalWrite(pin_out_value, LOW);
      digitalWrite(pin_out_light, LOW);
    }
}
