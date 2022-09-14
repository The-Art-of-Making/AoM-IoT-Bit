int pin_conn_stat_LED   = 6;                            // The pin for outputing the connection status to an LED

int pin_out_value       = 1;                            // The pin for writing the output signal
int pin_in_value        = 0;                            // The pin for reading the input signal

int pin_post_mode_swt   = A1;                           // The pin for reading the POST switch status
int pin_get_mode_swt    = A2;                           // The pin for reading the GET switch status


int pin_post_stat_LED   = A3;                           // The pin for outputing the POST status to an LED
int pin_get_stat_LED    = A6;                           // The pin for outputing the GET status to an LED


String low_message      = "LOW";                        // The message sent that represents a low digital signal
String high_message     = "HIGH";                       // The message sent that represents a high digital signal
String message_to_send  = "UNKNOWN";                    // The message to be sent
String message_recieved = "UNKNOWN";                    // The message recieved

void setup() {
  Serial.begin(9600);

  /* Set all pin modes */
    pinMode(pin_in_value,      INPUT);
    pinMode(pin_out_value,     OUTPUT);
    
    pinMode(pin_post_mode_swt, INPUT);
    pinMode(pin_get_mode_swt,  INPUT);
    
    pinMode(pin_conn_stat_LED, OUTPUT);
    pinMode(pin_post_stat_LED, OUTPUT);
    pinMode(pin_get_stat_LED,  OUTPUT);

}

void loop() {

  delay(1000);
  //Blink each LED 3 times
  Serial.println("Blinking WiFi Connection LED...");

  for (int i = 0; i <= 2; i++) {
    digitalWrite(pin_conn_stat_LED, HIGH);
    delay(500);
    digitalWrite(pin_conn_stat_LED, LOW);
    delay(500);
  }

  Serial.println("Blinking GET LED...");

  for (int i = 0; i <= 2; i++) {
    digitalWrite(pin_get_stat_LED, HIGH);
    delay(500);
    digitalWrite(pin_get_stat_LED, LOW);
    delay(500);
  }

  Serial.println("Blinking POST LED...");

  for (int i = 0; i <= 2; i++) {
    digitalWrite(pin_post_stat_LED, HIGH);
    delay(500);
    digitalWrite(pin_post_stat_LED, LOW);
    delay(500);
  }

  //get mode switch should be low
  while(digitalRead(pin_get_mode_swt) != LOW) {
    Serial.println("Flip that get mode switch to low, fool.");
    delay(500);
  }
    
  Serial.println("Reading GET Switch state...");
  Serial.print("Get switch mode:   ");
  Serial.println(digitalRead(pin_get_mode_swt));
  delay(1000);

  Serial.println("Flip get mode switch to HIGH");
  bool getPressed = false;
  while(!getPressed) {
    if (digitalRead(pin_get_mode_swt)) {
      getPressed = true;
    }
  }

  //post mode switch should be low
   while(digitalRead(pin_get_mode_swt) != LOW) {
    Serial.println("Flip that get mode switch to low, fool.");
  }
  Serial.println("Reading POST Switch state...");
  Serial.print("Get switch mode:   ");
  Serial.println(digitalRead(pin_post_mode_swt));
  delay(1000);

  Serial.println("Flip post mode switch to HIGH");
  bool postPressed = false;
  while(!postPressed) {
    if (digitalRead(pin_post_mode_swt)) {
      postPressed = true;
    }
  }
  



  
}
