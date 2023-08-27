"""Build responses for configuration requests"""

from os import environ
from sys import path
from time import time
from typing import Tuple

PROD_DEV_ENV = environ.get("PROD_DEV_ENV", "DEV_ENV")
if PROD_DEV_ENV == "PROD_ENV":
    path.append("cml/out/python")
    from cml.out.python import payload_pb2
    from cml.out.python.client import inner_payload_pb2 as client_inner_payload_pb2
    from cml.out.python.device import inner_payload_pb2 as device_inner_payload_pb2
else:
    path.append("../../../cml/out/python")
    import payload_pb2
    from client import inner_payload_pb2 as client_inner_payload_pb2
    from device import inner_payload_pb2 as device_inner_payload_pb2

MS_PER_S = 1000
CONFIG_ACK_VALUES = (payload_pb2.OUTBOUND, payload_pb2.RETRY)
CONFIG_INNER_PAYLOAD_TYPE_VALUES = (payload_pb2.CLIENT, payload_pb2.DEVICE)


def get_time_ms() -> int:
    """Get Unix Epoch Timestamp in milliseconds"""
    return round(time() * MS_PER_S)


class ConfigHandler:
    """Base class with common required methods"""

    def __init__(self, authenticate: callable, get_config: callable):
        self.authenticate = authenticate
        self.get_config = get_config


class ClientConfigHandler(ConfigHandler):
    """Handle requests for client config"""

    def __init__(self, authenticate: callable, get_config: callable):
        ConfigHandler.__init__(self, authenticate, get_config)

    def configure(
        self, request: client_inner_payload_pb2
    ) -> Tuple[bool, type(client_inner_payload_pb2)]:
        """Generate inner payload for client config response"""
        response = client_inner_payload_pb2.InnerPayload()
        success = False
        if request.type == client_inner_payload_pb2.CONFIG:
            if self.authenticate(
                request.config.common_config.uuid,
                request.config.common_config.token,
            ):
                response.type = client_inner_payload_pb2.CONFIG
                response.config.CopyFrom(
                    self.get_config(request.config.common_config.uuid)
                )
                success = True
        return (success, response)


class DeviceConfigHandler(ConfigHandler):
    """Handle requests for device config"""

    def __init__(self, authenticate: callable, get_config: callable):
        ConfigHandler.__init__(self, authenticate, get_config)

    def configure(
        self, request: device_inner_payload_pb2
    ) -> Tuple[bool, type(device_inner_payload_pb2)]:
        """Generate inner payload for device config response"""
        response = device_inner_payload_pb2.InnerPayload()
        success = False
        if request.type == device_inner_payload_pb2.CONFIG:
            if self.authenticate(
                request.config.common_config.uuid,
                request.config.common_config.token,
            ):
                response.type = device_inner_payload_pb2.CONFIG
                response.config.CopyFrom(
                    self.get_config(request.config.common_config.uuid)
                )
                success = True
        return (success, response)


class ConfigRequestHandler:
    """Respond to requests to get configs"""

    def __init__(
        self,
        client_config_handler: ClientConfigHandler,
        device_config_handler: DeviceConfigHandler,
    ):
        self.client_config_handler = client_config_handler
        self.device_config_handler = device_config_handler

    def check_config_request(self, payload_message: payload_pb2.Payload) -> bool:
        """Check if a payload proto has the correct fields and values to be a config request"""
        valid = True

        # Type must be GET
        if payload_message.type != payload_pb2.GET:
            valid = False

        # Ack must OUTBOUND or RETRY
        if payload_message.ack not in CONFIG_ACK_VALUES:
            valid = False

        # InnerPayloadType must CLIENT or DEVICE
        if payload_message.inner_payload_type not in CONFIG_INNER_PAYLOAD_TYPE_VALUES:
            valid = False

        # TTL must not have expired
        if (
            payload_message.ttl != 0
            and payload_message.timestamp + payload_message.ttl < get_time_ms()
        ):
            valid = False

        return valid

    def handle_payload(self, payload: bytes = b"") -> payload_pb2:
        """Parse payload and call handler corresponding to request config type"""
        payload_message = payload_pb2.Payload()
        success = False

        # Set inner payload as config response
        if payload_message.ParseFromString(payload) != 0:
            if self.check_config_request(payload_message):
                if payload_message.inner_payload_type == payload_pb2.CLIENT:
                    (
                        success,
                        client_inner_payload,
                    ) = self.client_config_handler.configure(
                        payload_message.client_inner_payload
                    )
                    payload_message.client_inner_payload.CopyFrom(client_inner_payload)
                if payload_message.inner_payload_type == payload_pb2.DEVICE:
                    (
                        success,
                        device_inner_payload,
                    ) = self.device_config_handler.configure(
                        payload_message.device_inner_payload
                    )
                    payload_message.device_inner_payload.CopyFrom(device_inner_payload)

        # Set type, ack, timestamp, and ttl
        payload_message.type = payload_pb2.SET
        if success:
            payload_message.ack = payload_pb2.INBOUND
        else:
            payload_message.ack = payload_pb2.NACK
        payload_message.timestamp = get_time_ms()
        payload_message.ttl = 0

        return payload_message


if __name__ == "__main__":
    pass
