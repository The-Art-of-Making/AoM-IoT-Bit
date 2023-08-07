"""Handle config requests and publish configs to MQTT server"""

from os import environ
from secrets import token_hex
from signal import signal, SIGTERM, SIGINT
from sys import exit as sys_exit
from time import sleep, time
from typing import Tuple
from uuid import uuid4
from google.protobuf.json_format import ParseDict
from google.protobuf.message import DecodeError

from database_handler import (
    DatabaseHandler_Actions,
    DatabaseHandler_MqttClients,
    DatabaseHandler_MqttDevices,
    DatabaseHandler_MqttServices,
)
from logger import logger
from protobufs import action_pb2
from protobufs import client_pb2
from protobufs import device_pb2
from protobufs import service_message_pb2
from pub_sub_clients import RabbitMQClient

UUID = "service-" + str(uuid4())
TOKEN = token_hex()
MQTT_SERVER_HOST = environ.get("MQTT_SERVER_HOST", "localhost")
MQTT_SERVER_PORT = int(environ.get("MQTT_SERVER_PORT", "5672"))
MQTT_EXCHANGE = environ.get("MQTT_EXCHANGE", "amq.topic")
CONFIG_TOPIC = environ.get("GET_CONFIG_TOPIC", "config.rabbitmq")
CONFIG_ROUTING_KEY = environ.get("CONFIG_ROUTING_KEY", "config.mqtt")
RECONNECT_DELAY = int(environ.get("RECONNECT_DELAY", "5"))


def get_device_actions(user_uuid: str) -> dict:
    """Get devices and their responses to all of a user's actions"""
    device_actions = {}
    actions = DatabaseHandler_Actions.get_actions(user_uuid=user_uuid)
    for action in actions:
        for device_uuid in action.responses:
            if device_uuid not in device_actions:
                device_actions[device_uuid] = {}
            device_actions[device_uuid][action.uuid] = {
                "name": action.name,
                "uuid": action.uuid,
                "user_uuid": action.user_uuid,
                "trigger_topic": action.trigger_topic,
                "trigger_state": action.trigger_state,
                "response": action.responses[device_uuid],
            }
    return device_actions


def build_device_message(
    mqtt_device, device_actions: dict
) -> device_pb2.Device:  # TODO type annotation for mqtt_device
    """Build a device proto message from an MQTT device database object and
    user-associated device actions"""
    device_uuid = mqtt_device.uuid
    device_config = {
        "name": mqtt_device.name,
        "uuid": device_uuid,
        "user_uuid": mqtt_device.user_uuid,
        "client_uuid": mqtt_device.client_uuid,
        "client_name": mqtt_device.client_name,
        "number": mqtt_device.number,
        "io": device_pb2.OUTPUT if mqtt_device.io == "output" else device_pb2.INPUT,
        "signal": device_pb2.DIGITAL
        if mqtt_device.signal == "digital"
        else device_pb2.ANALOG,
    }
    device_message = device_pb2.Device()
    ParseDict(device_config, device_message)
    if device_uuid in device_actions:
        for action_uuid in device_actions[device_uuid]:
            action_message = action_pb2.Action()
            ParseDict(device_actions[device_uuid][action_uuid], action_message)
            device_message.actions.append(action_message)
    return device_message


def build_client_message(
    mqtt_client, device_messages: list
) -> client_pb2.Client:  # TODO type annotation for mqtt_client
    """Build a client proto message from an MQTT client database object and
    client-associated device messages"""
    client_config = {
        "name": mqtt_client.name,
        "uuid": mqtt_client.uuid,
        "user_uuid": mqtt_client.user_uuid,
    }
    client_message = client_pb2.Client()
    ParseDict(client_config, client_message)
    for device_message in device_messages:
        client_message.devices.append(device_message)
    return client_message


def build_client_config(client: client_pb2.Client) -> Tuple[str, bytes]:
    """Build client config with devices and actions.
    Return topic to publish to and message bytes"""
    client_config = (None, b"")
    if DatabaseHandler_MqttClients.client_auth(client.uuid, client.token):
        mqtt_client = DatabaseHandler_MqttClients.get_client(client.uuid)
        device_actions = get_device_actions(user_uuid=mqtt_client.user_uuid)
        mqtt_devices = DatabaseHandler_MqttDevices.get_client_devices(
            client_uuid=client.uuid
        )
        device_messages = []
        for mqtt_device in mqtt_devices:
            device_messages.append(build_device_message(mqtt_device, device_actions))
        service_message = service_message_pb2.ServiceMessage()
        service_message_config = {
            "type": service_message_pb2.CLIENT_CONFIG,
            "timestamp": time(),
            "client": build_client_message(mqtt_client, device_messages),
        }
        ParseDict(service_message_config, service_message)
        # TODO add topic builder (see frontend)
        config_topic = (
            "users."
            + mqtt_client.user_uuid
            + ".clients."
            + mqtt_client.uuid
            + ".config"
        )
        client_config = (config_topic, service_message.SerializeToString())
        logger.info("Client config built for %s", mqtt_client.uuid)
    else:
        logger.info("Failed to authenticate client %s", client.uuid)
    return client_config


def handle_messages(message: bytes) -> None:
    """Handle messages from RabbitMQ and send responses"""
    service_message = service_message_pb2.ServiceMessage()
    try:
        if service_message.ParseFromString(message) != 0:
            if service_message.type == service_message_pb2.CLIENT_CONFIG:
                logger.info("Client config request received")
                topic, client_config = build_client_config(service_message.client)
                logger.info(topic)
                logger.info(client_config)
                rabbitmq_client.publish(topic, client_config)
    except DecodeError as execption:
        logger.warning("DecodeError: %s", execption)


def signal_handler(signal_received, frame) -> None:
    """Perform graceful shutdown on SIGTERM or SIGINT"""
    logger.info("Recd %s from %s", signal_received, frame)
    logger.info("SIGTERM or SIGINT or CTRL-C detected. Exiting gracefully")

    # TODO verify stop consuming new messages
    # rabbitmq_client.stop()

    # Remove MQTT service authentication info from database
    if not DatabaseHandler_MqttServices.delete_service(uuid=UUID):
        logger.warning("Failed to delete MQTT service %s from database", UUID)

    # Exit cleanly
    sys_exit(0)


signal(SIGINT, signal_handler)
signal(SIGTERM, signal_handler)


rabbitmq_client = RabbitMQClient(
    MQTT_SERVER_HOST,
    MQTT_SERVER_PORT,
    UUID,
    TOKEN,
    MQTT_EXCHANGE,
    queue=CONFIG_TOPIC,
    routing_key=CONFIG_ROUTING_KEY,
    on_message_callback=handle_messages,
)

if __name__ == "__main__":
    assert DatabaseHandler_MqttServices.add_service(UUID, TOKEN)
    while True:
        rabbitmq_client.run()
        if rabbitmq_client.should_reconnect:
            rabbitmq_client.stop()
            logger.info("Reconnecting after %d seconds", RECONNECT_DELAY)
            sleep(RECONNECT_DELAY)
            rabbitmq_client = RabbitMQClient(
                MQTT_SERVER_HOST,
                MQTT_SERVER_PORT,
                UUID,
                TOKEN,
                MQTT_EXCHANGE,
                queue=CONFIG_TOPIC,
                routing_key=CONFIG_ROUTING_KEY,
                on_message_callback=handle_messages,
            )
