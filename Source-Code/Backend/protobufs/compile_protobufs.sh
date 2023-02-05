#!/bin/bash

echo "Initializing submodules..."
git submodule init

echo "Compiling protobufs for python..."
PYTHON_OUT_DIR=./python_out
if [ ! -d "$PYTHON_OUT_DIR" ]; then
    echo "Creating python_out directory"
    mkdir $PYTHON_OUT_DIR
fi
protoc -I ./device --python_out=$PYTHON_OUT_DIR ./device/device.proto
protoc -I ./controller -I ./device --python_out=$PYTHON_OUT_DIR ./controller/controller_message.proto
cp -r $PYTHON_OUT_DIR ../mqtt-controller/application/protobufs

echo "Compiling protobufs for C (nanopb)..."
C_OUT_DIR=./c_out
if [ ! -d "$C_OUT_DIR" ]; then
    echo "Creating c_out directory"
    mkdir $C_OUT_DIR
fi
python3 nanopb/generator/nanopb_generator.py device/device.proto -I ./device -D $C_OUT_DIR
python3 nanopb/generator/nanopb_generator.py controller/controller_message.proto -I ./controller -I ./device -D $C_OUT_DIR
