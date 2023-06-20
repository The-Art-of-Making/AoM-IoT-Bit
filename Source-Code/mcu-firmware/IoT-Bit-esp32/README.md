# IoT-Bit-esp32 Firmware

ESP32-based firmware for connecting the IoT Bit to an MQTT server.

Target board: ESP32

## Overview

1. Wifi and MQTT authentication credentials are read from the SD card.
2. The Bit connects to Wifi.
3. If a Wifi connection is established, the Bit then tries to connect to a MQTT server, authenticate, and subscribe to the `config` and `cmd` topics corresponding to its devices.
4. The Bit configures its devices based on the configuration received on the `config` topic. Configurations information is stored in protocol buffers sent in the payload of MQTT messages published to the `config` topics.
5. The Bit publishes messages with the value of its input devices to the `state` topics whenever the values of the input devices change. The Bit also updates its output devices whenever it receives a message with an updated output value on the `cmd` topics. Lastly, the Bit reports its status and the status of its devices on the corresponding `status` topics.

## Prerequisites

1. ESP-IDF (Espressif IoT Development Framework)

   See [https://docs.espressif.com/projects/esp-idf/en/latest/esp32/get-started/](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/get-started/)

2. nanopb and protoc (Optional)

   The `compile_protobufs.sh` script found in the `Source-Code/Backend/protobufs` directory can be used to automatically compile the necessary proto files. While technically only `nanopb` (which is submoduled in this repository) is needed to generate the C implementation of the protocol buffers used in the firmware, the script generates the implementations for both C and Python, and therefore also depends on `protoc` to run correctly in its current form. If you do not wish to install `protoc` or wish to compile the proto files manually, you may do so solely with `nanopb`.

   On Debian-based Linux distributions, `protoc` can be installed with `apt install -y protobuf-compiler`.

   The requirements for `nanopb` can be installed with `pip3 install protobuf grpcio-tools`.

## Build

1. Compile the proto files found in `Source-Code/Backend/protobufs` using nanopb. The header files output from compilation should be placed in the `include` directory of the `protobufs` component, and the C files should be placed in the `src` directory of the `protobufs` component. It is highly recommended to use the `compile_protobufs.sh` script for this process since it automates these tasks.
2. Build the `IoT-Bit-esp32` with IDF (e.g. `idf.py build`).
3. Connect the IoT Bit over USB and flash the firmware with IDF (e.g. `idf.py -p /dev/ttyUSB0 flash monitor`).

## Roadmap

### v5.0

- Transition to ESP32-based firmware
- Configuration over MQTT
- Status and config topics for clients
- Command, state, and status topics for devices

### v5.1

- Support for Actions

### v5.2

- Support for Zones

### v5.3

- Generic and specific templates and configurations for clients and devices
