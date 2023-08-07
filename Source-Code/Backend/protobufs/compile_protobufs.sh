#!/bin/bash

echo "Initializing submodules..."
git submodule init

echo "Compiling protobufs for python..."
PYTHON_OUT_DIR=./python_out
MQTT_CONFIG_PROTOBUFS=../mqtt-config/application/protobufs
if [ ! -d "$PYTHON_OUT_DIR" ]; then
    echo "Creating python_out directory"
    mkdir -p $PYTHON_OUT_DIR
fi
if [ ! -d "$MQTT_CONFIG_PROTOBUFS" ]; then
    echo "Creating mqtt-config/application/protobufs directory"
    mkdir -p $MQTT_CONFIG_PROTOBUFS
fi
protoc -I ./action --python_out=$PYTHON_OUT_DIR ./action/action.proto
protoc -I ./device -I ./action --python_out=$PYTHON_OUT_DIR ./device/device.proto
protoc -I ./client -I ./device -I ./action --python_out=$PYTHON_OUT_DIR ./client/client.proto
protoc -I ./service -I ./client -I ./device -I ./action --python_out=$PYTHON_OUT_DIR ./service/service_message.proto
echo "Updating import paths for device_pb2.py, client_pb2.py, service_message_pb2.py..."
sed -i "s/import action_pb2 as action__pb2/import protobufs.action_pb2 as action__pb2/g" $PYTHON_OUT_DIR/device_pb2.py
sed -i "s/import action_pb2 as action__pb2/import protobufs.action_pb2 as action__pb2/g" $PYTHON_OUT_DIR/client_pb2.py
sed -i "s/import device_pb2 as device__pb2/import protobufs.device_pb2 as device__pb2/g" $PYTHON_OUT_DIR/client_pb2.py
sed -i "s/import action_pb2 as action__pb2/import protobufs.action_pb2 as action__pb2/g" $PYTHON_OUT_DIR/service_message_pb2.py
sed -i "s/import device_pb2 as device__pb2/import protobufs.device_pb2 as device__pb2/g" $PYTHON_OUT_DIR/service_message_pb2.py
sed -i "s/import client_pb2 as client__pb2/import protobufs.client_pb2 as client__pb2/g" $PYTHON_OUT_DIR/service_message_pb2.py
echo "Copying output to project protobuf directories..."
rm -Rf $MQTT_CONFIG_PROTOBUFS/* && cp -r $PYTHON_OUT_DIR/* $MQTT_CONFIG_PROTOBUFS/


echo "Compiling protobufs for C (nanopb)..."
C_OUT_DIR=./c_out
FIRMWARE_DIR_V4=../../mcu-firmware/IoT-Bit-V4.0
FIRMWARE_DIR_ESP32=../../mcu-firmware/IoT-Bit-esp32/components/protobufs
if [ ! -d "$C_OUT_DIR" ]; then
    echo "Creating c_out directory"
    mkdir -p $C_OUT_DIR
fi
if [ ! -d "$FIRMWARE_DIR_ESP32/include" ]; then
    echo "Creating IoT-Bit-esp32/components/protobufs/include directory"
    mkdir -p $FIRMWARE_DIR_ESP32/include
fi
if [ ! -d "$FIRMWARE_DIR_ESP32/src" ]; then
    echo "Creating IoT-Bit-esp32/components/protobufs/src directory"
    mkdir -p $FIRMWARE_DIR_ESP32/src
fi
cd nanopb
git submodule update --remote
cd ../
python3 nanopb/generator/nanopb_generator.py action/action.proto -I ./action -D $C_OUT_DIR
python3 nanopb/generator/nanopb_generator.py device/device.proto -I ./device -I ./action -D $C_OUT_DIR
python3 nanopb/generator/nanopb_generator.py client/client.proto -I ./client -I ./device -I ./action -D $C_OUT_DIR
python3 nanopb/generator/nanopb_generator.py service/service_message.proto -I ./service -I ./client -I ./device -I ./action -D $C_OUT_DIR
rm -Rf $FIRMWARE_DIR_V4/*.pb.*
rm -Rf $FIRMWARE_DIR_ESP32/include/*.pb.*
rm -Rf $FIRMWARE_DIR_ESP32/src/*.pb.*
cp nanopb/pb.h nanopb/pb_common.h nanopb/pb_common.c nanopb/pb_decode.h nanopb/pb_decode.c $FIRMWARE_DIR_V4
cp nanopb/pb.h nanopb/pb_common.h nanopb/pb_decode.h $FIRMWARE_DIR_ESP32/include
cp nanopb/pb_common.c nanopb/pb_decode.c $FIRMWARE_DIR_ESP32/src
cp -r $C_OUT_DIR/* $FIRMWARE_DIR_V4
cp -r $C_OUT_DIR/*.h $FIRMWARE_DIR_ESP32/include
cp -r $C_OUT_DIR/*.c $FIRMWARE_DIR_ESP32/src

