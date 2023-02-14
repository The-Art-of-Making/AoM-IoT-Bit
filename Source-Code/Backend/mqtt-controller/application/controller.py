from google.protobuf.json_format import ParseDict
from hashlib import sha256
from os import environ
from secrets import token_hex
from time import time
from typing import Tuple
from uuid import uuid4

from database_handler import MQTTController, MQTTServer
from logger import logger
import protobufs.controller_message_pb2 as controller_message_pb2  # TODO resolve PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION=python workaround
from server_handler import start_server, shutdown_server, check_server
from thread_handler import ThreadHandler
from rabbitmq_handler import RabbitMQConsumer, RabbitMQPublisher

controller_queue = environ.get("RABBITMQ_CONTROLLER_QUEUE", "controller_messages")
config_queue = environ.get("RABBITMQ_CONFIG_QUEUE", "config_messages")


class Controller(ThreadHandler):
    """Threaded Controller for starting, shutting down, and checking MQTT servers"""

    def __init__(self):
        """Add Controller authentication info to database and initialize RabbitMQ consumers and producers"""
        super().__init__(target=self.controller)

        # Add controller authentication info to database
        self.username = str(uuid4())
        self.password = token_hex()
        password_hash = sha256(self.password.encode()).hexdigest()
        if not MQTTController.add_controller(self.username, password_hash):
            logger.warning("Failed to add controller " + self.username + " to database")

        # Initialize RabbitMQ consumers and producers
        self.rabbitmq_controller_consumer = RabbitMQConsumer(
            queue=controller_queue, username=self.username, password=self.password
        )
        self.rabbitmq_controller_publisher = RabbitMQPublisher(
            queue=controller_queue, username=self.username, password=self.password
        )
        self.rabbitmq_config_publisher = RabbitMQPublisher(
            queue=config_queue, username=self.username, password=self.password
        )

        # Start Controller thread
        self.start()

    def stop_controller(self) -> None:
        """Stop Controller thread, RabbitMQ consumers and producers, remove authentication info from database"""
        # Stop Controller thread
        self.stop()

        # Stop and disconnect RabbitMQ consumers and publishers
        self.rabbitmq_controller_consumer.disconnect()
        self.rabbitmq_controller_publisher.disconnect()
        self.rabbitmq_config_publisher.disconnect()

        # Remove controller authentication info from database
        if not MQTTController.delete_controller(username=self.username):
            logger.warning(
                "Failed to delete controller " + self.username + " from database"
            )

    def controller_check_server(
        self,
        controller_message: controller_message_pb2.ControllerMessage,
    ) -> None:
        """Perfrom server check and publish new server check message if server check successful"""
        # Check server
        timestamp, client_count, client_count_timestamp = check_server(
            controller_message.server_info.name,
            controller_message.server_info.user,
            controller_message.server_info.uid,
            controller_message.timestamp,
            controller_message.server_info.client_count,
            controller_message.server_info.client_count_timestamp,
        )
        if None in (timestamp, client_count, client_count_timestamp):
            return

        # Publish new CHECK_SERVER message
        message = {
            "type": controller_message_pb2.CHECK_SERVER,
            "timestamp": timestamp,
            "server_info": {
                "user": controller_message.server_info.user,
                "name": controller_message.server_info.name,
                "uid": controller_message.server_info.uid,
                "client_count_timestamp": client_count_timestamp,
                "client_count": client_count,
            },
        }
        check_server_message = controller_message_pb2.ControllerMessage()
        ParseDict(message, check_server_message)
        self.rabbitmq_controller_publisher.put_message(
            check_server_message.SerializeToString()
        )

    def get_server_config(self, user: str = "") -> None:
        """Publish GET_CONFIG message to get config for MQTT server devices"""
        # Get server from database
        server = MQTTServer.get_server(user=user)
        if server is None:
            return

        # Publish GET_CONFIG message
        config_message = {
            "type": controller_message_pb2.GET_SERVER_CONFIG,
            "timestamp": time(),
            "server_info": {
                "user": server.user,
                "name": server.name,
                "uid": server.uid,
            },
        }
        get_config_message = controller_message_pb2.ControllerMessage()
        ParseDict(config_message, get_config_message)
        self.rabbitmq_controller_publisher.put_message(
            get_config_message.SerializeToString()
        )

    def on_server_start(self, user: str = "") -> None:
        """Publish GET_CONFIG message and CHECK_SERVER message on server start"""
        # Get server from database
        server = MQTTServer.get_server(user=user)
        if server is None:
            return

        # Publish initial GET_CONFIG message
        self.get_server_config(user=user)

        # TODO Publish initial CHECK_SERVER message
        # check_message = {
        #     "type": controller_message_pb2.CHECK_SERVER,
        #     "timestamp": time(),
        #     "server_info": {
        #         "user": server.user,
        #         "name": server.name,
        #         "uid": server.uid,
        #         "client_count_timestamp": time(),
        #         "client_count": 0,
        #     },
        # }
        # check_server_message = controller_message_pb2.ControllerMessage()
        # ParseDict(check_message, check_server_message)
        # self.rabbitmq_controller_publisher.put_message(
        #     check_server_message.SerializeToString()
        # )

    def controller_start_server(self, user: str) -> None:
        """Start new MQTT server for user"""
        if not len(user) > 0:
            return
        # TODO add server status waiting in db
        start_server(
            user=user, callback=self.on_server_start, callback_kwargs={"user": user}
        )

    def publish_start_message(self, user: str) -> Tuple[bool, str]:
        """Publish START_SERVER message"""
        if not len(user) > 0:
            return False, "Missing user"
        logger.info("Publishing start message for server with user " + user)
        try:
            start_message = {
                "type": controller_message_pb2.START_SERVER,
                "timestamp": time(),
                "server_info": {"user": user},
            }
            controller_message = controller_message_pb2.ControllerMessage()
            ParseDict(start_message, controller_message)
            self.rabbitmq_controller_publisher.put_message(
                controller_message.SerializeToString()
            )
            return True, "Server is starting"
        except:
            return False, "Failed to start server"

    def publish_shutdown_message(self, user: str) -> Tuple[bool, str]:
        """Publish SHUTDOWN_SERVER message"""
        if not len(user) > 0:
            return False, "Missing user"
        logger.info("Publishing shutdown message for server with user " + user)
        try:
            shutdown_message = {
                "type": controller_message_pb2.SHUTDOWN_SERVER,
                "timestamp": time(),
                "server_info": {"user": user},
            }
            controller_message = controller_message_pb2.ControllerMessage()
            ParseDict(shutdown_message, controller_message)
            self.rabbitmq_controller_publisher.put_message(
                controller_message.SerializeToString()
            )
            return True, "Server is shutting down"
        except:
            return False, "Failed to shutdown server"

    def controller(self) -> None:
        """Main control loop to handle messages from RabbitMQ and perform corresponding actions"""
        message = self.rabbitmq_controller_consumer.get_message()
        controller_message = controller_message_pb2.ControllerMessage()
        if controller_message.ParseFromString(message) == 0:
            return
        if controller_message.type == controller_message_pb2.START_SERVER:
            self.controller_start_server(user=controller_message.server_info.user)
        if controller_message.type == controller_message_pb2.CHECK_SERVER:
            self.controller_check_server(controller_message=controller_message)
        if controller_message.type == controller_message_pb2.PUBLISH_DEVICE_CONFIG:
            # TODO publish device config to mqtt server
            pass
        if controller_message.type == controller_message_pb2.SHUTDOWN_SERVER:
            shutdown_server(controller_message.server_info.user)
