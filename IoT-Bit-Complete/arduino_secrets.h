/* This is a "header file," hence the ".h" file extension.
 * 
 * Any data contained in a header file will be accessible to the code in an Arduino script (".ino") file if
 * the header file is included using an "#include" statement in the .ino file.
 * 
 * An example of this can be seen in the "IoT-Bit-Push.ino" file, 
 * which contains a "#include arduino_secrets_mine.h" file.
 * 
 * Enter the required information in between the double quatations after each defined variable name.
 * Be careful - it's case sensitive.
 * 
 * Don't forget to rename this file "arduino_secrets_mine.h" !
 */

/* This is the name of the WiFi network you're connecting to. 
 * It will be the same as you see on your computer, e.g. "WIRELESS-PITTNET"
 */
#define SECRET_SSID  ""			

/* This is the password of the WiFi netowrk you're connecting to. 
 * If you are connecting to WIRELESS-PITTNET, your password will be your pitt username, e.g. abs123
 */
#define SECRET_PASS  ""

/* This is the username attached to your Adafruit IO account. */
#define IO_USERNAME  ""

/* This is NOT your Adafruit IO password. Your Adafruit IO account has a unique key attached to it that serves 
 * as a security measure for sending data across WiFi and through the internet.
 * Details on accessing this key can be found in the instructions document  
 */
#define IO_KEY       ""

/* This is similar to your Adafruit key, but it is a key unique to a single group that you've created.
 * Details on accessing this key can be found.
 */
#define IO_GROUP     ""

/* The two values below are the strings that will indicate to the IoT bit whether to output a low or high voltage.
 * They must be strings that match the value recorded in the Adafruit IO cloud exactly. 
 * 
 * For example, if adding a task to my calendar records a value of "TASK_CREATED" in my Adafruit IO feed,
 * and I would like this value to signify the IoT bit to output a high voltage, the entry in the HIGH_MESSAGE field 
 * must be "TASK_CREATED"
 */
#define LOW_MESSAGE  ""
#define HIGH_MESSAGE ""
