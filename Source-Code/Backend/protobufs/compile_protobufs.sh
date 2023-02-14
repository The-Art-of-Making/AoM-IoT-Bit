#!/bin/bash

echo "Initializing submodules..."
git submodule init

echo "Compiling protobufs for python..."
PYTHON_OUT_DIR=./python_out
MQTT_CONTROLLER_PROTOBUFS=../mqtt-controller/application/protobufs
if [ ! -d "$PYTHON_OUT_DIR" ]; then
    echo "Creating python_out directory"
    mkdir $PYTHON_OUT_DIR
fi
if [ ! -d "$MQTT_CONTROLLER_PROTOBUFS" ]; then
    echo "Creating mqtt-controller/application/protobufs directory"
    mkdir $MQTT_CONTROLLER_PROTOBUFS
fi
protoc -I ./device --python_out=$PYTHON_OUT_DIR ./device/device.proto
protoc -I ./controller -I ./device --python_out=$PYTHON_OUT_DIR ./controller/controller_message.proto
rm -Rf $MQTT_CONTROLLER_PROTOBUFS/* && cp -r $PYTHON_OUT_DIR/* $MQTT_CONTROLLER_PROTOBUFS/
sed -i "s/import device_pb2 as device__pb2/import protobufs.device_pb2 as device__pb2/g" $MQTT_CONTROLLER_PROTOBUFS/controller_message_pb2.py

echo "Compiling protobufs for C (nanopb)..."
C_OUT_DIR=./c_out
if [ ! -d "$C_OUT_DIR" ]; then
    echo "Creating c_out directory"
    mkdir $C_OUT_DIR
fi
python3 nanopb/generator/nanopb_generator.py device/device.proto -I ./device -D $C_OUT_DIR
python3 nanopb/generator/nanopb_generator.py controller/controller_message.proto -I ./controller -I ./device -D $C_OUT_DIR
