#include <SPI.h>                               // Neccessary Library for SD card usage.
#include <SD.h>                                // Neccessary Library for SD card usage.

File currentFile;

bool initializeSD()
{
    Serial.println("Initializing SD card...");
    
    if (!SD.begin(4))
    {
      Serial.println("initialization failed!");
      return false;
    }
    else
    {
      Serial.println("initialization done!");
      return true;
    }
}

bool writeToFile(String fileName, String textToWrite)
{
    /* If we cannot initialize the SD card then don't write */
    if (!initializeSD())
    {
      return false;
    }

    /* Open the file. note that only one file can be open at a time, so you have to close this one before opening another. */
    currentFile = SD.open(fileName, FILE_WRITE);
  
    /* If the file opened write to it */
    if (currentFile)
    {
      Serial.print("Writing to" + fileName + "...");
      
      currentFile.println(textToWrite);
      
      /* Close the file */
      currentFile.close();
      
      Serial.println("done writing.");
      
      return true;
    }
    else
    {
      /* If the file didn't open, print an error */
      Serial.println("error opening " + fileName);
      
      return false;
    }
}

String readfromFile(String fileName)
{
    /* If we cannot initialize the SD card then don't read */
    if (!initializeSD())
    {
      return "NULL";
    }
    
    /* Open the file for reading */
    currentFile = SD.open(fileName);
    String contents = "";

    /* If the file opened read from it */
    if (currentFile)
    {
      Serial.print("Reading from" + fileName + "...");
      /* Read from the file until there's nothing else in it */
      while (currentFile.available())
      {
        contents.concat(currentFile.readString());
      }
      
      /* Close the file */
      currentFile.close();

      Serial.println("done reading.");
      
      return contents;
    }
    else
    {
      /* If the file didn't open, print an error */
      Serial.println("error opening " + fileName);
      return "NULL";
    }
}
