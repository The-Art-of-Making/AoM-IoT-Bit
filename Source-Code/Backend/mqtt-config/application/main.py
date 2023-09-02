"""Handle config requests and publish configs to MQTT server"""

from os import environ
from secrets import token_hex
from signal import signal, SIGTERM, SIGINT
from sys import exit as sys_exit, path
from time import sleep
from uuid import uuid4

from config_handler import (
    ClientConfigHandler,
    DeviceConfigHandler,
    ConfigRequestHandler,
)
from database_handler import (
    DatabaseHandler_Actions,
    DatabaseHandler_MqttClients,
    DatabaseHandler_MqttDevices,
    DatabaseHandler_MqttServices,
)
from logger import logger
from pub_sub_clients import RabbitMQClient
from topic_builder import (
    TOPICBUILDER_AMQP_DELIMITER,
    TopicBuilder_Route,
    TopicBuilder_ClientTopic,
    TopicBuilder_DeviceTopic,
    TopicBuilder_Context,
)

PROD_DEV_ENV = environ.get("PROD_DEV_ENV", "DEV_ENV")
if PROD_DEV_ENV == "PROD_ENV":
    path.append("cml/out/python")
    from cml.out.python import payload_pb2
    from cml.out.python.client import client_config_pb2
    from cml.out.python.device import device_config_pb2, device_action_pb2
else:
    path.append("../../../cml/out/python")
    import payload_pb2
    from client import client_config_pb2
    from device import device_config_pb2, device_action_pb2

UUID = "service-" + str(uuid4())
TOKEN = token_hex()
MQTT_SERVER_HOST = environ.get("MQTT_SERVER_HOST", "localhost")
MQTT_SERVER_PORT = int(environ.get("MQTT_SERVER_PORT", "5672"))
MQTT_EXCHANGE = environ.get("MQTT_EXCHANGE", "amq.topic")
CONFIG_TOPIC = environ.get("GET_CONFIG_TOPIC", "config.rabbitmq")
CONFIG_ROUTING_KEY = environ.get("CONFIG_ROUTING_KEY", "config.mqtt")
RECONNECT_DELAY = int(environ.get("RECONNECT_DELAY", "5"))

topic_builder_context = TopicBuilder_Context(TOPICBUILDER_AMQP_DELIMITER)


def get_device_config(uuid: str) -> device_config_pb2:
    """Populate device config with values from database"""
    device_config = device_config_pb2.Config()
    device = DatabaseHandler_MqttDevices.get_device(uuid=uuid)
    actions = DatabaseHandler_Actions.get_actions(user_uuid=device.user_uuid)

    device_config.common_config.name = device.name
    device_config.common_config.uuid = device.uuid
    device_config.common_config.token = device.token
    device_config.user_uuid = device.user_uuid
    device_config.client_uuid = device.client_uuid
    device_config.client_name = device.client_name
    device_config.number = device.number

    if device.config_type == "Generic Digital Output":
        device_config.config_type = device_config_pb2.GENERIC_DIGITAL_OUTPUT
    if device.config_type == "Generic Digital Input":
        device_config.config_type = device_config_pb2.GENERIC_DIGITAL_INPUT
    if device.config_type == "Generic Analog Output":
        device_config.config_type = device_config_pb2.GENERIC_ANALOG_OUTPUT
    if device.config_type == "Generic Analog Input":
        device_config.config_type = device_config_pb2.GENERIC_ANALOG_INPUT

    if device.uuid in actions:
        for action in actions[device.uuid]:
            action_config = device_action_pb2.Action()
            action_config.common_config.name = action.name
            action_config.common_config.uuid = action.uuid
            action_config.user_uuid = action.user_uuid
            action_config.trigger_topic = action.trigger_topic
            action_config.trgger_response = action.trigger_response
            action_config.response = action.responses[device.uuid]
            device_config.actions.append(action_config)

    logger.info("Populated config for device %s", device_config.common_config.uuid)

    return device_config


def get_client_config(uuid: str) -> client_config_pb2:
    """Populate client config with values from database"""
    client_config = client_config_pb2.Config()
    client = DatabaseHandler_MqttClients.get_client(uuid=uuid)
    devices = DatabaseHandler_MqttDevices.get_client_devices(client_uuid=uuid)

    client_config.common_config.name = client.name
    client_config.common_config.uuid = client.uuid
    client_config.common_config.token = client.token
    client_config.user_uuid = client.user_uuid
    for device in devices:
        client_config.device_configs.append(get_device_config(device.uuid))
    logger.info("Populated config for client %s", client_config.common_config.uuid)

    return client_config


def config_topic_builder(payload: payload_pb2) -> str:
    """Build config topic based on payload fields"""
    topic = ""

    if payload.inner_payload_type == payload_pb2.CLIENT:
        topic = (
            topic_builder_context.clear_topic()
            .append_route(
                TopicBuilder_Route.TOPICBUILDER_ROUTE_USER,
                payload.client_inner_payload.config.user_uuid,
            )
            .append_route(
                TopicBuilder_Route.TOPICBUILDER_ROUTE_CLIENT,
                payload.client_inner_payload.config.common_config.uuid,
            )
            .set_client_topic(TopicBuilder_ClientTopic.TOPICBUILDER_CLIENTTOPIC_CONFIG)
            .get_topic()
        )
    if payload.inner_payload_type == payload_pb2.DEVICE:
        topic = (
            topic_builder_context.clear_topic()
            .append_route(
                TopicBuilder_Route.TOPICBUILDER_ROUTE_USER,
                payload.device_inner_payload.config.user_uuid,
            )
            .append_route(
                TopicBuilder_Route.TOPICBUILDER_ROUTE_CLIENT,
                payload.device_inner_payload.config.client_uuid,
            )
            .append_route(
                TopicBuilder_Route.TOPICBUILDER_ROUTE_DEVICE,
                payload.device_inner_payload.config.common_config.uuid,
            )
            .set_device_topic(TopicBuilder_DeviceTopic.TOPICBUILDER_DEVICETOPIC_CONFIG)
            .get_topic()
        )

    return topic


def handle_messages(message: bytes) -> None:
    """Handle messages from RabbitMQ and send responses"""
    logger.info("Config request received")
    payload = config_request_handler.handle_payload(message)
    topic = config_topic_builder(payload)
    logger.info("Publishing config to topic %s", topic)
    logger.debug(payload)
    rabbitmq_client.publish(topic, payload.SerializeToString())


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

client_config_handler = ClientConfigHandler(
    DatabaseHandler_MqttClients.client_auth, get_client_config
)
device_config_handler = DeviceConfigHandler(
    DatabaseHandler_MqttDevices.device_auth, get_device_config
)
config_request_handler = ConfigRequestHandler(
    client_config_handler, device_config_handler
)

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
