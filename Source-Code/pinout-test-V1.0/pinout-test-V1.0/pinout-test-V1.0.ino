int pin_potentiometer   = A1;                           // The pin for the anolog input of the potentiometer

int pin_in_value        = A2;                           // The pin for reading the message_to_send digital value
int pin_out_value       = A3;                           // The pin for writing the message_recieved digital value

int pin_post_stat_LED   = 0;                            // The pin for outputing the POST status to an LED
int pin_post_mode_swt   = 1;                            // The pin for reading the POST switch status

int pin_get_stat_LED    = 2;                            // The pin for outputing the GET status to an LED
int pin_get_mode_swt    = 3;                            // The pin for reading the GET switch status

int pin_conn_stat_LED   = 6;                            // The pin for outputing the connection status to an LED

void setup() {
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

  /**
   * Write all pins to low
   */
    digitalWrite(pin_in_value, LOW);
    digitalWrite(pin_out_value, LOW);
    
    digitalWrite(pin_post_mode_swt, LOW);
    digitalWrite(pin_get_mode_swt,  LOW);
    
    digitalWrite(pin_conn_stat_LED, LOW);
    digitalWrite(pin_post_stat_LED, LOW);
    digitalWrite(pin_get_stat_LED,  LOW);

  


}
