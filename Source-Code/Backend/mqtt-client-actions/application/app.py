from google.protobuf.json_format import ParseDict
from hashlib import sha256
from os import environ
from secrets import token_hex
from signal import signal, SIGTERM, SIGINT
from uuid import uuid4

from database_handler import Action, MQTTController, MQTTDevice
from logger import logger
import protobufs.controller_message_pb2 as controller_message_pb2  # TODO resolve PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION=python workaround
import protobufs.device_pb2 as device_pb2
from rabbitmq_handler import RabbitMQConsumer, RabbitMQPublisher

controller_queue = environ.get("RABBITMQ_CONTROLLER_QUEUE", "controller_messages")
action_queue = environ.get("RABBITMQ_CONFIG_QUEUE", "config_messages")

username = str(uuid4())
password = token_hex()
password_hash = sha256(password.encode()).hexdigest()
if not MQTTController.add_controller(username, password_hash):
    logger.warning("Failed to add controller " + username + " to database")

# Initialize RabbitMQ consumers and producers
rabbitmq_action_consumer = RabbitMQConsumer(
    queue=action_queue, username=username, password=password
)
rabbitmq_controller_publisher = RabbitMQPublisher(
    queue=controller_queue, username=username, password=password
)


def handle_config_message(
    controller_message: controller_message_pb2.ControllerMessage,
) -> None:
    """Get actions for devices and publish device configs to server"""
    try:
        user = controller_message.server_info.user
        device_actions = {}
        actions = Action.get_actions(user=user)
        for action in actions:
            for device in action.responses:
                if device not in device_actions:
                    device_actions[device] = {}
                device_actions[device][action.uid] = {
                    "user": action.user,
                    "name": action.name,
                    "uid": action.uid,
                    "trigger_topic": action.trigger_topic,
                    "trigger_state": action.trigger_state,
                    "response": action.responses[device],
                }
        devices = MQTTDevice.get_devices(user=user)
        for device in devices:
            device_config = {
                "type": controller_message_pb2.PUBLISH_DEVICE_CONFIG,
                "server_info": {"user": user},
                "device": {
                    "user": user,
                    "uid": device.uid,
                    "client_name": device.client_name,
                    "client_username": device.client_username,
                    "name": device.name,
                    "number": device.number,
                    "io": device_pb2.OUTPUT
                    if device.io == "output"
                    else device_pb2.INPUT,
                    "signal": device_pb2.DIGITAL
                    if device.signal == "digital"
                    else device_pb2.ANALOG,
                },
            }
            publish_config_message = controller_message_pb2.ControllerMessage()
            ParseDict(device_config, publish_config_message)
            for action in device_actions[device.uid]:
                action_message = device_pb2.Action()
                ParseDict(device_actions[device.uid][action], action_message)
                publish_config_message.device.actions.append(action_message)
            rabbitmq_controller_publisher.put_message(
                publish_config_message.SerializeToString()
            )
            logger.info(f"Published config message for device {device.uid}")
    except Exception as exception:
        logger.warning("Error publishing config message")
        logger.warning(exception)


def signal_handler(signal_received, frame):
    """Perform graceful shutdown on SIGTERM or SIGINT"""
    logger.info(f"Recd {signal_received} from {frame}")
    logger.info("SIGTERM or SIGINT or CTRL-C detected. Exiting gracefully")

    # Stop and disconnect RabbitMQ consumers and producers
    rabbitmq_action_consumer.disconnect()
    rabbitmq_controller_publisher.disconnect()

    # Remove controller authentication info from database
    if not MQTTController.delete_controller(username=username):
        logger.warning("Failed to delete controller " + username + " from database")

    exit(0)


signal(SIGINT, signal_handler)
signal(SIGTERM, signal_handler)


if __name__ == "__main__":
    while True:
        message = rabbitmq_action_consumer.get_message()
        controller_message = controller_message_pb2.ControllerMessage()
        if controller_message.ParseFromString(message) == 0:
            continue
        if controller_message.type == controller_message_pb2.GET_SERVER_CONFIG:
            handle_config_message(controller_message=controller_message)
