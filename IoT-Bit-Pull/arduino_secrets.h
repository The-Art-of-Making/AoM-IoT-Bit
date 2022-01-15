/* This is a "header file," hence the ".h" file extension.
 * 
 * Any data contained in a header file will be accessible to the code in an Arduino script (".ino") file if
 * the header file is included using an "#include" statement in the .ino file.
 * 
 * An example of this can be seen in the "IoT-Bit-Pull.ino" file, 
 * which contains a "#include arduino_secrets_mine.h" file.
 *  
 * /

//This is the name of the WiFi network you're connecting to. 
//It will be the same as you see on your computer, e.g. "WIRELESS_PITTNET"
#define SECRET_SSID  ""			

//This is the password of the WiFi netowrk you're connecting to. 
//If you are connecting to WIRELESS_PITTNET, your password will be your pitt username, e.g. abs123
#define SECRET_PASS  ""

//This is the username attached to your Adafruit IO account. 
#define IO_USERNAME  ""

//This is NOT your Adafruit IO password. Your Adafruit IO account has a unique key attached to it that serves 
//as a security measure for sending data across WiFi and through the internet.
//Details on accessing this key can be found 
#define IO_KEY       ""

//This is similar to your Adafruit key, but it is a key unique to a single feed that you've created.
//Details on accessing this key can be found.
#define IO_FEED_KEY  ""

