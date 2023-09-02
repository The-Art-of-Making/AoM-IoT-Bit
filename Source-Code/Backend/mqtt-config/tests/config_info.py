"""Config info needed for testing"""

from os import environ
from sys import path
from secrets import token_hex
from uuid import uuid4

path.append("../../../cml/out/python")
from device import device_config_pb2

SERVER_IP = environ.get("TEST_SERVER_IP", "localhost")
SERVER_PORT = int(environ.get("TEST_SERVER_PORT", "1883"))

CLIENT_NAME = environ.get("TEST_CLIENT_NAME", "Test Client")
CLIENT_UUID = environ.get("TEST_CLIENT_UUID", "client-" + str(uuid4()))
CLIENT_TOKEN = environ.get("TEST_CLIENT_TOKEN", token_hex())

DEVICE_NAME = environ.get("TEST_DEVICE_NAME", "Test Device")
DEVICE_UUID = environ.get("TEST_DEVICE_UUID", "device-" + str(uuid4()))
DEVICE_TOKEN = environ.get("TEST_DEVICE_TOKEN", token_hex())
DEVICE_NUMBER = int(environ.get("TEST_DEVICE_NUMBER", "0"))
DEVICE_CONFIG_TYPE = int(
    environ.get(
        "TEST_DEVICE_CONFIG_TYPE", str(device_config_pb2.GENERIC_DIGITAL_OUTPUT)
    )
)

USER_UUID = environ.get("TEST_USER_UUID", "user-" + str(uuid4()))

CONFIG_ROUTING_KEY = environ.get("CONFIG_ROUTING_KEY", "config.mqtt")
MQTT_CONFIG_TOPIC = environ.get("MQTT_CONFIG_TOPIC", "config/mqtt")
