/*
 * Authors: Mark Hofmeister, Issam Abushaban
 * Created: 1/24/2022
 * Last Updated: 1/24/2022
 * Version: V1.1
 *
 */

#include "MicroSD_IO.h"                                // Header file for wifi setup functions

/* SD card attached to SPI bus as follows, do not use these pins
 *  MOSI  - pin 11
 *  MISO  - pin 12
 *  CLK   - pin 13
 *  CS    - pin  4
 */


void setup()
{
    /* Begins Serial monitor for debugging purposes. */
    Serial.begin(9600);
    bool good = initializeSD();
    if(good)
      Serial.println("SD Card initialized");
}

void loop()
{
  String contents = readFromFile("secrets.txt");
  Serial.println(contents);
  Serial.println(contents.length());
    
  delay(10000);
}
