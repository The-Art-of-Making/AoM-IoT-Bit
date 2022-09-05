/*
 * Authors: Mark Hofmeister, Issam Abushaban
 * Created: 7/30/2022
 * Last Updated: 7/30/2022
 * Version: V3.0
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

 /** Process for LED indicating
 *  WiFi disconnected: Neither POST nor GET LEDs blink, CONN stat LED off
 *  WiFi connected: CONN stat LED changes to on 
 *  POST ISR triggered, POST switch on, message post successful: POST LED will blink
 *  GET switch on, message get successul: GET LED will blink
 * 
 */

int pin_conn_stat_LED   = 6;                            // The pin for outputing the connection status to an LED

int pin_out_value       = 1;                            // The pin for writing the output signal
int pin_in_value        = 0;                            // The pin for reading the input signal

int pin_post_mode_swt   = A1;                           // The pin for reading the POST switch status
int pin_get_mode_swt    = A2;                           // The pin for reading the GET switch status


int pin_post_stat_LED   = A3;                           // The pin for outputing the POST status to an LED
int pin_get_stat_LED    = A4;                           // The pin for outputing the GET status to an LED


String low_message      = "LOW";                        // The message sent that represents a low digital signal
String high_message     = "HIGH";                       // The message sent that represents a high digital signal
String message_to_send  = "UNKNOWN";                    // The message to be sent
String message_recieved = "UNKNOWN";                    // The message recieved

unsigned long lastConnectionTime = 0;                   // Last time you connected to the server, in milliseconds

int ISR_debounce_delay = 200;                           // Delay time for debouncing switches in ISRs, in milliseconds 

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
    do
    {
      for (int i = 0; i < 3; i++)
      {        
        delay(200);
        digitalWrite(pin_get_stat_LED, HIGH);
        digitalWrite(pin_post_stat_LED, HIGH);
        digitalWrite(pin_conn_stat_LED, HIGH);
        delay(200);
        
        digitalWrite(pin_get_stat_LED, LOW);
        digitalWrite(pin_post_stat_LED, LOW);
        digitalWrite(pin_conn_stat_LED, LOW);
      }
      
      /* Give Them 5 seconds */
      Serial.print("Checking For SD card in...");
      Serial.print("5...");
      delay(1000);
      Serial.print("4...");
      delay(1000);
      Serial.print("3...");
      delay(1000);
      Serial.print("2...");
      delay(1000);
      Serial.print("1...");
      delay(1000);
      Serial.println("0");
      delay(1000);
    }
    while(initializeCredentials() == false);
    
    /* Let them know that the device is ready */
    digitalWrite(pin_get_stat_LED, HIGH);
    digitalWrite(pin_post_stat_LED, HIGH);
    digitalWrite(pin_conn_stat_LED, HIGH);
    delay(1000);
    digitalWrite(pin_get_stat_LED, LOW);
    digitalWrite(pin_post_stat_LED, LOW);
    digitalWrite(pin_conn_stat_LED, LOW);
    delay(1000);

    /*
     * Interrupts
     * - POST_ISR = triggered whenever the input signal value changes state 
     * - POST_LED_ISR = triggered whenever the post switch changes state
     * - GET_LED_ISR = triggered whenever the get switch goes changes state
     */
    attachInterrupt(digitalPinToInterrupt(pin_in_value), POST_ISR, CHANGE);  
    //attachInterrupt(digitalPinToInterrupt(pin_post_mode_swt), POST_LED_ISR, CHANGE); 
    //attachInterrupt(digitalPinToInterrupt(pin_get_mode_swt), GET_LED_ISR, CHANGE); 
}

   
void loop()
{
  
    Serial.println(digitalRead(pin_post_mode_swt));
    
    Serial.println(digitalRead(pin_get_mode_swt));
    
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

      /* Print out the request interval */
      Serial.println("\nRequest Interval: " + String(requestInterval/1000) + "s");
      
      /* Interrupts will handle the POST case */
      /* Determine the GET switch state and if the device should GET. */    
      if (digitalRead(pin_get_mode_swt) == HIGH)
      {
          
          /* Disable interrupts so POST signal changes do not interfere with GET */
          noInterrupts();
          
          while(!message_GET()) 
          {
            //Blinking means that there has been a problem getting the message 
            delay(requestInterval);
          }
                 
          /* Re-enable interrupts once complete with GET sequence. */
          interrupts();
          
          delay(requestInterval);
      }
      
      
    }

}

bool message_POST()
{
    /* If no activity for an entire posting interval, retry */
    if (millis() - lastConnectionTime > requestInterval)          
    {
      
      /* Read state from pin */
      int pin_state = digitalRead(pin_in_value);
      
      /* Set local light based on state */
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

      bool postRequestSuccess;
      
      while(postRequestSuccess == false) {

        postRequestSuccess = http_Request_POST(message_to_send); 
       
        /* Request a connection to Adafruit IO */
        if (postRequestSuccess) {
          
          /* Note the time that the connection was made */
          lastConnectionTime = millis();
          Serial.println("Data upload suceeded!");
          return true;
        }
        else
        {
          /* if you couldn't make a connection */
          Serial.println("Data upload failed!");
          blinkLED(pin_post_stat_LED);
        }
      }
   }
   return false;
}

bool message_GET()
{
    /* Request a connection to Adafruit IO and ask for a GET request */
    message_recieved = http_Request_GET();
    
    if (message_recieved != "NULL")
    {
      /* Note the time that the connection was made */
      Serial.println("Data download succeeded!");
      blinkLED(pin_get_stat_LED);
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

/** 
 *  Blinks LED twice, for a delay period specified by function variable
 *  Precondition: LED is assumed to be LOW 
 *  Postcondition: LED is LOW 
 *  param: LED pin number 
 *  return: none 
 */
void blinkLED(byte pinNum) {
  
  int LEDDelayPeriod = 500;
  
    digitalWrite(pinNum, HIGH);
    delay(500);
    digitalWrite(pinNum, LOW);
    delay(500);  
}

void POST_ISR() {

  bool success = false;
  
  /* Indicate that we have entered the POST interrupt service routine */
  Serial.println("POST ISR Entered."); 
  
  /* Only post if POST switch is enabled*/
  if(digitalRead(pin_post_mode_swt) == HIGH) {

    //record bool when POST message funcion called
    success = message_POST();

    //Report post status, blink LED if successful
    if(success) {
      Serial.println("Message posted successully.");
      blinkLED(pin_post_stat_LED);
    } else {
      Serial.println("Message post failed.");
    }
  }

}
