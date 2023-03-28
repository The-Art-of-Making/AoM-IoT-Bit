# IoT-Bit-V4.0 Firmware

Arduino-based firmware for connecting the IoT Bit to an MQTT server.

Target board: Arduino MKR WiFi 1010

## Overview

1. Wifi and MQTT authentication credentials are read from the SD card.
2. The Bit connects to Wifi.
3. If a Wifi connection is established, the Bit then tries to connect to a MQTT server, authenticate, and subscribe to the `config` and `cmd` topics corresponding to its devices.
4. The Bit configures its devices based on the configuration received on the `config` topics. Configurations information is stored in protocol buffers sent in the payload of MQTT messages published to the `config` topics.
5. The Bit publishes messages with the value of its input devices to the `state` topics whenever the values of the input devices change. The Bit also updates its output devices whenever it receives a message with an updated output value on the `cmd` topics.

## Prerequisites

1. Arduino `WiFiNINA` and `Ethernet` libraries

2. PubSubClient library for Arduino

   See [https://github.com/knolleary/pubsubclient](https://github.com/knolleary/pubsubclient)

3. nanopb and protoc (Optional)

   The `compile_protobufs.sh` script found in the `Source-Code/Backend/protobufs` directory can be used to automatically compile the necessary proto files. While technically only nanopb (which ships with this respository) is needed to generate the C implementation of the protocol buffers used in the firmware, the script generates the implementations for both C and python, and therefore also depends on protoc to run correctly in its current form. If you do not wish to install protoc or wish to compile the proto files manually, you may do so solely with nanopb.

## Build

1. Compile the proto files found in `Source-Code/Backend/protobufs` using nanopb
2. Open `IoT-Bit-V4.0.ino` in the Arduino IDE
3. Connect the IoT Bit and select the correct Board (Arduino MKR WiFi 1010) and Port
4. Click the "Upload" button to compile the firmware and upload it to the board
