#!/bin/bash

echo "Initializing submodules..."
git submodule init

echo "Compiling protobufs for python..."
protoc -I ./device --python_out=./ ./device/device.proto
protoc -I ./controller -I ./device --python_out=./ ./controller/controller_message.proto

echo "Compiling protobufs for C (nanopb)..."
python3 nanopb/generator/nanopb_generator.py device/device.proto -I ./device -D ./
python3 nanopb/generator/nanopb_generator.py controller/controller_message.proto -I ./controller -I ./device -D ./
