#!/bin/bash

echo "Initializing submodules..."
git submodule init

echo "Compiling protobufs for python..."
PYTHON_OUT_DIR=./python_out
MQTT_CONTROLLER_PROTOBUFS=../mqtt-controller/application/protobufs
MQTT_CLIENT_ACTIONS_PROTOBUFS=../mqtt-client-actions/application/protobufs
if [ ! -d "$PYTHON_OUT_DIR" ]; then
    echo "Creating python_out directory"
    mkdir $PYTHON_OUT_DIR
fi
if [ ! -d "$MQTT_CONTROLLER_PROTOBUFS" ]; then
    echo "Creating mqtt-controller/application/protobufs directory"
    mkdir $MQTT_CONTROLLER_PROTOBUFS
fi
if [ ! -d "$MQTT_CLIENT_ACTIONS_PROTOBUFS" ]; then
    echo "Creating mqtt-client-actions/application/protobufs directory"
    mkdir $MQTT_CLIENT_ACTIONS_PROTOBUFS
fi
protoc -I ./device --python_out=$PYTHON_OUT_DIR ./device/device.proto
protoc -I ./controller -I ./device --python_out=$PYTHON_OUT_DIR ./controller/controller_message.proto
rm -Rf $MQTT_CONTROLLER_PROTOBUFS/* && cp -r $PYTHON_OUT_DIR/* $MQTT_CONTROLLER_PROTOBUFS/
rm -Rf $MQTT_CLIENT_ACTIONS_PROTOBUFS/* && cp -r $PYTHON_OUT_DIR/* $MQTT_CLIENT_ACTIONS_PROTOBUFS/
sed -i "s/import device_pb2 as device__pb2/import protobufs.device_pb2 as device__pb2/g" $MQTT_CONTROLLER_PROTOBUFS/controller_message_pb2.py
sed -i "s/import device_pb2 as device__pb2/import protobufs.device_pb2 as device__pb2/g" $MQTT_CLIENT_ACTIONS_PROTOBUFS/controller_message_pb2.py

echo "Compiling protobufs for C (nanopb)..."
C_OUT_DIR=./c_out
FIRMWARE_DIR=../../mcu-firmware/IoT-Bit-V4.0
if [ ! -d "$C_OUT_DIR" ]; then
    echo "Creating c_out directory"
    mkdir $C_OUT_DIR
fi
cd nanopb
git submodule update --remote
cd ../
python3 nanopb/generator/nanopb_generator.py device/device.proto -I ./device -D $C_OUT_DIR
python3 nanopb/generator/nanopb_generator.py controller/controller_message.proto -I ./controller -I ./device -D $C_OUT_DIR
rm -Rf $FIRMWARE_DIR/*.pb.*
cp nanopb/pb.h nanopb/pb_common.h nanopb/pb_common.c nanopb/pb_decode.h nanopb/pb_decode.c $FIRMWARE_DIR
cp -r $C_OUT_DIR/* $FIRMWARE_DIR
