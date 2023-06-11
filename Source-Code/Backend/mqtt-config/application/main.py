"""Handle config requests and publish configs to MQTT server"""

from os import environ
from secrets import token_hex
from signal import signal, SIGTERM, SIGINT
from time import time
from uuid import uuid4
from google.protobuf.json_format import ParseDict
import paho.mqtt.client as paho_mqtt

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

UUID = "service-" + str(uuid4())
TOKEN = token_hex()
MQTT_SERVER_HOST = environ.get("MQTT_SERVER_HOST", "")
MQTT_SERVER_PORT = int(environ.get("MQTT_SERVER_PORT", "1883"))
GET_CONFIG_TOPIC = "/get-config"


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


def handle_client_config(client: client_pb2.Client) -> None:
    """Publish client config with devices and actions to MQTT server"""
    if DatabaseHandler_MqttClients.client_auth(client.uuid, client.token):
        mqtt_client = DatabaseHandler_MqttClients.get_client(client.uuid)
        device_actions = get_device_actions(user_uuid=client.user_uuid)
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
        config_topic = (
            "/" + mqtt_client.user_uuid + "/clients/" + mqtt_client.uuid + "/config"
        )
        paho_mqtt_client.publish(
            config_topic, service_message.SerializeToString(), qos=1, retain=True
        )
        logger.info("Client config published for %s", mqtt_client.uuid)
    else:
        logger.info("Failed to authenticate client %s", client.uuid)


def on_connect(client: paho_mqtt.Client, userdata, flags, result_code) -> None:
    """Callback for when the client receives a CONNACK response from the server
    Subscribing in on_connect() means that if we lose the connection and
    reconnect then subscriptions will be renewed.  Subscribe to "get-config"
    topic to receive requests for client configs"""

    logger.info("Connected to MQTT server with result code %s", result_code)
    logger.info("Subscribing to %s topic", GET_CONFIG_TOPIC)
    client.subscribe(GET_CONFIG_TOPIC)


def on_message(client: paho_mqtt.Client, userdata, mqtt_message) -> None:
    """Callback for when a PUBLISH message is received from the server"""
    if mqtt_message.topic == GET_CONFIG_TOPIC:
        service_message = service_message_pb2.ServiceMessage()
        if service_message.ParseFromString(mqtt_message.payload) != 0:
            if service_message.type == service_message_pb2.CLIENT_CONFIG:
                logger.info("Client config request received")
                handle_client_config(service_message.client)


paho_mqtt_client = paho_mqtt.Client(client_id=UUID)
paho_mqtt_client.username_pw_set(UUID, TOKEN)
paho_mqtt_client.on_connect = on_connect
paho_mqtt_client.on_message = on_message


def signal_handler(signal_received, frame) -> None:
    """Perform graceful shutdown on SIGTERM or SIGINT"""
    logger.info("Recd %s from %s", signal_received, frame)
    logger.info("SIGTERM or SIGINT or CTRL-C detected. Exiting gracefully")

    # TODO stop paho_mqtt_client

    # Remove MQTT service authentication info from database
    if not DatabaseHandler_MqttServices.delete_service(uuid=UUID):
        logger.warning("Failed to delete MQTT service %s from database", UUID)

    exit(0)


signal(SIGINT, signal_handler)
signal(SIGTERM, signal_handler)

if __name__ == "__main__":
    assert DatabaseHandler_MqttServices.add_service(UUID, TOKEN)
    paho_mqtt_client.connect(MQTT_SERVER_HOST, MQTT_SERVER_PORT)
    paho_mqtt_client.loop_forever()
