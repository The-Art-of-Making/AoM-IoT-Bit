"""Config info needed for testing"""

from sys import path
from secrets import token_hex
from uuid import uuid4

path.append("../../../cml/out/python")
from device import config_pb2 as device_config_pb2

CLIENT_UUID = "client-" + str(uuid4())
CLIENT_NAME = "Test Client"
CLIENT_TOKEN = token_hex()
DEVICE_UUID = "device-" + str(uuid4())
DEVICE_NAME = "Test Device"
DEVICE_NUMBER = 0
DEVICE_CONFIG_TYPE = device_config_pb2.GENERIC_DIGITAL_OUTPUT
DEVICE_TOKEN = token_hex()
USER_UUID = "user-" + str(uuid4())
