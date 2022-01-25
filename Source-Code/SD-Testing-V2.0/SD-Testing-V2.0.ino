/*
 * Authors: Mark Hofmeister, Issam Abushaban
 * Created: 1/24/2022
 * Last Updated: 1/24/2022
 * Version: V1.1
 * 
 * Description:
 *  This code will use Arduino's MKR WiFi 1010 microcontroller platform to:
 *    1. Read a file from an SD card, allowing students to upload their wifi credentials with ease.
 *    1. Take a digital input value as a message, POST it to the adafruit cloud and display the POST status to an LED.
 *    2. GET the latest message from the adafruit cloud, display the GET status to an LED, and Output a digital output value.
 *    3. Accept an analog value from a potentiometer to determine the request interval.
 * 
 */

#include "Wifi_Setup.h"                                 // Header file for wifi setup functions

/* SD card attached to SPI bus as follows, do not use these pins
 *  MOSI  - pin 11
 *  MISO  - pin 12
 *  CLK   - pin 13
 *  CS    - pin  4
 */

int pin_potentiometer   = A1;                           // The pin for the anolog input of the potentiometer

int pin_in_value        = A2;                           // The pin for reading the message_to_send digital value
int pin_out_value       = A3;                           // The pin for writing the message_recieved digital value

int pin_post_stat_LED   = 0;                            // The pin for outputing the POST status to an LED
int pin_post_mode_swt   = 1;                            // The pin for reading the POST switch status

int pin_get_stat_LED    = 2;                            // The pin for outputing the GET status to an LED
int pin_get_mode_swt    = 3;                            // The pin for reading the GET switch status

int pin_conn_stat_LED   = 6;                            // The pin for outputing the connection status to an LED

String low_message      = "LOW";                        // The message sent that represents a low digital signal
String high_message     = "HIGH";                       // The message sent that represents a high digital signal
String message_to_send  = "UNKNOWN";                    // The message to be sent
String message_recieved = "UNKNOWN";                    // The message recieved

unsigned long lastConnectionTime = 0;                   // Last time you connected to the server, in milliseconds
unsigned long requestInterval    = 2000;                // Delay between updates, in milliseconds



void setup()
{
    /* Begins Serial monitor for debugging purposes. */
    Serial.begin(9600);
    
    /* Set all pin modes */
    pinMode(pin_in_value,      INPUT);
    pinMode(pin_out_value,     OUTPUT);
    
    pinMode(pin_post_mode_swt, INPUT);
    pinMode(pin_get_mode_swt,  INPUT);
    
    pinMode(pin_conn_stat_LED, OUTPUT);
    pinMode(pin_post_stat_LED, OUTPUT);
    pinMode(pin_get_stat_LED,  OUTPUT);

    /* Attempt to read from secrets.txt */
    while (initializeCredentials() == false)
    {
      for (int i = 0; i == 3; i++)
      {        
        Serial.println("Bad Credentials File!");
        digitalWrite(pin_get_stat_LED, HIGH);
        digitalWrite(pin_post_stat_LED, HIGH);
        digitalWrite(pin_conn_stat_LED, HIGH);
        delay(500);
        
        digitalWrite(pin_get_stat_LED, LOW);
        digitalWrite(pin_post_stat_LED, LOW);
        digitalWrite(pin_conn_stat_LED, LOW);
        delay(500);
      }
    }
    
}

void loop()
{

  
    /* Determine if no desire to POST or GET. */
    if ((digitalRead(pin_post_mode_swt) == LOW) && (digitalRead(pin_get_mode_swt) == LOW))
    {      
      /* Attempt to close connection */
      Serial.println("Switches are turned off, disconnecting from any WIFI...");
      disconnectFromWIFI();
      
      /* Connection to WiFi terminated */
      digitalWrite(pin_conn_stat_LED, LOW);
      digitalWrite(pin_post_stat_LED, LOW);
      digitalWrite(pin_get_stat_LED, LOW);
    }
    else if (!wifi_connected()) /* Determine if wifi connection needs to be restablished. */
    {
      /* Connection to WiFi terminated */
      digitalWrite(pin_conn_stat_LED, LOW);
      digitalWrite(pin_post_stat_LED, LOW);
      digitalWrite(pin_get_stat_LED, LOW);
      
      /* Attempt to restablish connection */
      Serial.println("Initializing connection to WIFI...");
      if(connectToWIFI())
      {
        /* Connection to WiFi established */
        digitalWrite(pin_conn_stat_LED, HIGH);
      }
    }
    else /* All other cases assume a connection to wifi. */
    {
      /* Determine the POST switch state and if the device should POST. */
      if (digitalRead(pin_post_mode_swt) == HIGH)
      {
        digitalWrite(pin_post_stat_LED, HIGH);
        if(!message_POST()) return;
        digitalWrite(pin_post_stat_LED, LOW);
        
        delay(requestInterval);
      }
      else if (digitalRead(pin_post_mode_swt) == LOW)
      {
        digitalWrite(pin_post_stat_LED, LOW);
      }

      /* Determine the GET switch state and if the device should GET. */    
      if (digitalRead(pin_get_mode_swt) == HIGH)
      {
        digitalWrite(pin_get_stat_LED, HIGH);
        if(!message_GET()) return;
        digitalWrite(pin_get_stat_LED, LOW);
        
        delay(requestInterval);
      }
      else if (digitalRead(pin_get_mode_swt) == LOW)
      {
        digitalWrite(pin_get_stat_LED, LOW);
      }
      
    }

    /* Set the request interval based on the potentiometer [As of 01/21/22 range is 2 - 60 seconds] */
    set_request_interval();
  
    Serial.println("\nRequest Interval: " + String(requestInterval/1000) + "s");

}

void set_request_interval()
{
    /* Read the anolog value from potentiometer */
    int potentiometer_value = analogRead(pin_potentiometer);
  
    requestInterval = map(potentiometer_value, 0, 1023, 2000, 60000);
}

bool message_POST()
{
    /* If no activity for an entire posting interval, retry */
    if (millis() - lastConnectionTime > requestInterval)          
    {
      
      /* Read state from pin */
      int pin_state = digitalRead(pin_in_value);
      
      /* Set local light based on state O */
      if (pin_state == 0) 
      {
        message_to_send = low_message;
      } 
      else if (pin_state == 1) 
      {
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
        return true;
      }
      else
      {
        /* if you couldn't make a connection */
        Serial.println("Data upload failed!");
        return false;
      }
    }
}

bool message_GET()
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
      return false;
    }

    Serial.println("Recieved message: " + message_recieved);
    
    if (message_recieved == high_message)
    {
      digitalWrite(pin_out_value, HIGH);
    } 
    else if (message_recieved == low_message) 
    {
      digitalWrite(pin_out_value, LOW);
    }
    
    return true;
}
