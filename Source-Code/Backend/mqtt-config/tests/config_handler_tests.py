"""Test config handler methods"""

from sys import path
from google.protobuf.json_format import ParseDict

from config_info import *

path.append("../../../cml/out/python")
import payload_pb2
from client import inner_payload_pb2 as client_inner_payload_pb2
from client import config_pb2 as client_config_pb2
from device import inner_payload_pb2 as device_inner_payload_pb2
from device import config_pb2 as device_config_pb2

path.append("../application")
from config_handler import (
    ClientConfigHandler,
    DeviceConfigHandler,
    ConfigRequestHandler,
    get_time_ms,
)

DEVICE_CONFIG_INNER_PAYLOAD = {
    "type": device_inner_payload_pb2.CONFIG,
    "config": {
        "common_config": {
            "name": DEVICE_NAME,
            "uuid": DEVICE_UUID,
            "token": DEVICE_TOKEN,
        },
        "user_uuid": USER_UUID,
        "client_uuid": CLIENT_UUID,
        "client_name": CLIENT_NAME,
        "number": 0,
        "config_type": device_config_pb2.GENERIC_DIGITAL_OUTPUT
        # TODO actions
    },
}

CLIENT_CONFIG_INNER_PAYLOAD = {
    "type": client_inner_payload_pb2.CONFIG,
    "config": {
        "common_config": {
            "name": CLIENT_NAME,
            "uuid": CLIENT_UUID,
            "token": CLIENT_TOKEN,
        },
        "user_uuid": USER_UUID,
        "device_configs": [DEVICE_CONFIG_INNER_PAYLOAD["config"]],
    },
}

CLIENT_CONFIG_PAYLOAD_GET = {
    "type": payload_pb2.GET,
    "ack": payload_pb2.OUTBOUND,
    "ttl": 0,
    "inner_payload_type": payload_pb2.CLIENT,
}

DEVICE_CONFIG_PAYLOAD_GET = {
    "type": payload_pb2.GET,
    "ack": payload_pb2.OUTBOUND,
    "ttl": 0,
    "inner_payload_type": payload_pb2.DEVICE,
}


def build_client_inner_payload_get_config() -> client_inner_payload_pb2:
    """Build inner payload for getting client config"""
    request_inner_payload = client_inner_payload_pb2.InnerPayload()

    request_inner_payload.type = client_inner_payload_pb2.CONFIG
    request_inner_payload.config.common_config.uuid = CLIENT_UUID
    request_inner_payload.config.common_config.token = CLIENT_TOKEN

    return request_inner_payload


def build_device_inner_payload_get_config() -> device_inner_payload_pb2:
    """Build inner payload for getting device config"""
    request_inner_payload = device_inner_payload_pb2.InnerPayload()

    request_inner_payload.type = device_inner_payload_pb2.CONFIG
    request_inner_payload.config.common_config.uuid = DEVICE_UUID
    request_inner_payload.config.common_config.token = DEVICE_TOKEN

    return request_inner_payload


def authenicate_client(uuid: str = "", token: str = "") -> bool:
    """Test authenticating client"""
    auth = False
    if uuid == CLIENT_UUID and token == CLIENT_TOKEN:
        auth = True
    return auth


def authenicate_device(uuid: str = "", token: str = "") -> bool:
    """Test authenticating device"""
    auth = False
    if uuid == DEVICE_UUID and token == DEVICE_TOKEN:
        auth = True
    return auth


def get_client_config(uuid: str = "") -> client_config_pb2:
    """Populate client config with test values"""
    inner_payload = client_inner_payload_pb2.InnerPayload()
    ParseDict(CLIENT_CONFIG_INNER_PAYLOAD, inner_payload)
    return inner_payload.config


def get_device_config(uuid: str = "") -> device_config_pb2:
    """Populate device config with test values"""
    inner_payload = device_inner_payload_pb2.InnerPayload()
    ParseDict(DEVICE_CONFIG_INNER_PAYLOAD, inner_payload)
    return inner_payload.config


client_config_handler = ClientConfigHandler(authenicate_client, get_client_config)
device_config_handler = DeviceConfigHandler(authenicate_device, get_device_config)
config_request_handler = ConfigRequestHandler(
    client_config_handler, device_config_handler
)


def test_client_config():
    """Test client config handler configure method"""

    # Get response
    success, client_config = client_config_handler.configure(
        build_client_inner_payload_get_config()
    )

    # Validate response
    response_inner_payload = client_inner_payload_pb2.InnerPayload()
    ParseDict(CLIENT_CONFIG_INNER_PAYLOAD, response_inner_payload)
    assert client_config == response_inner_payload
    assert success


def test_device_config():
    """Test client config handler configure method"""
    response_inner_payload = device_inner_payload_pb2.InnerPayload()

    # Get response
    success, device_config = device_config_handler.configure(
        build_device_inner_payload_get_config()
    )

    # Validate response
    ParseDict(DEVICE_CONFIG_INNER_PAYLOAD, response_inner_payload)
    assert device_config == response_inner_payload
    assert success


def test_config_request_handler():
    """Test handling config requests with different types"""
    payload = payload_pb2.Payload()

    # Get client config
    ParseDict(CLIENT_CONFIG_PAYLOAD_GET, payload)
    payload.timestamp = get_time_ms()
    payload.client_inner_payload.CopyFrom(build_client_inner_payload_get_config())
    payload = config_request_handler.handle_payload(payload.SerializeToString())
    response_inner_payload = client_inner_payload_pb2.InnerPayload()
    ParseDict(CLIENT_CONFIG_INNER_PAYLOAD, response_inner_payload)
    assert payload.client_inner_payload == response_inner_payload
    assert payload.type == payload_pb2.SET
    assert payload.ack == payload_pb2.INBOUND
    assert payload.inner_payload_type == payload_pb2.CLIENT

    # Get device config
    ParseDict(DEVICE_CONFIG_PAYLOAD_GET, payload)
    payload.timestamp = get_time_ms()
    payload.device_inner_payload.CopyFrom(build_device_inner_payload_get_config())
    payload = config_request_handler.handle_payload(payload.SerializeToString())
    response_inner_payload = device_inner_payload_pb2.InnerPayload()
    ParseDict(DEVICE_CONFIG_INNER_PAYLOAD, response_inner_payload)
    assert payload.device_inner_payload == response_inner_payload
    assert payload.type == payload_pb2.SET
    assert payload.ack == payload_pb2.INBOUND
    assert payload.inner_payload_type == payload_pb2.DEVICE
