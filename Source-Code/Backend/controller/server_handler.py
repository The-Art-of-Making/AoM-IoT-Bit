import paho.mqtt.client as mqtt
from time import time
from uuid import uuid4

from database_handler import create_server, delete_server
from logger import logger
from thread_handler import ThreadHandler

INACTIVITY_THRESHOLD = 60  # shutdown MQTT server if more than a minute elapsed without multiple clients connected
CLIENTS_CONNECTED_TOPIC = "$SYS/broker/clients/connected"  # number of connected clients


class ServerHandler(ThreadHandler):
    """Represents MQTT server
    Start, stop, and check activity of MQTT server"""

    def __init__(
        self,
        user: str,
        inactivity_threshold: int = INACTIVITY_THRESHOLD,
    ):
        super().__init__(target=self.handler)
        self.uuid = str(uuid4())
        self.user = user
        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.topics = {}
        self.inactivity_threshold = inactivity_threshold
        self.last_client_count_update = time()
        self.start_server()

    def __del__(self):
        # avoid potential recursive loop?
        # self.shutdown()
        print("ServerHandler __del__")

    def on_connect(self, client: mqtt.Client, userdata, flags, rc) -> None:
        """Callback for when client receives a CONNACK response from server"""
        logger.info("Connected with result code " + str(rc))
        # Subscribing in on_connect() means subscriptions will be renewed if connection lost and reconnect
        for topic in self.topics:
            client.subscribe(topic)
        # Subscribe to connected clients topic
        if CLIENTS_CONNECTED_TOPIC not in self.topics:
            self.subscribe(CLIENTS_CONNECTED_TOPIC, int)

    def on_message(self, client: mqtt.Client, userdata, msg) -> None:
        """Callback for when a PUBLISH message is received from server"""
        logger.info(msg.topic + " : " + str(msg.payload))
        if msg.topic in self.topics:
            # Update topic value and cast payload as current data type
            self.topics[msg.topic] = type(self.topics[msg.topic])(msg.payload)

    def subscribe(self, topic: str, data_type: type) -> None:
        """Add topic subscription"""
        if topic not in self.topics:
            self.topics[topic] = data_type()
            self.client.subscribe(topic)

    def unsubscribe(self, topic: str) -> None:
        """Remove topic subscription"""
        if topic in self.topics:
            self.client.unsubscribe(topic)
            del self.topics[topic]

    def start_server(self) -> bool:
        """Start new MQTT server"""
        try:
            server_info = {"user": self.user, "uuid": self.uuid}
            if create_server(server_info):
                # load config
                # pass new uuid
                # send signal to kubernetes to start container
                # update document info (addr, port) if container started
                # delete server document if failed to start container
                logger.info(f"Server {self.uuid} started")
                self.client.connect("localhost", 1883, 60)
                logger.info(f"Running server {self.uuid} handler")
                self.start()
        except:
            logger.warning("Failed to start sever")
            return False
        return True

    def shutdown(self):
        """Stutdown MQTT server"""
        # save config and states to db
        # send signal to kubernetes to terminate container
        logger.info("Stopping server...")
        self.running = False
        delete_server(self.uuid)

    def update_client_count(self, count) -> None:
        """Update client count if it changes and update last count update time"""
        if count != self.topics.get(CLIENTS_CONNECTED_TOPIC):
            self.topics[CLIENTS_CONNECTED_TOPIC] = count
            self.last_client_count_update = time()

    def check_inactive(self) -> None:
        """Checks if client count has been 1 for at least the threshold duration
        and shuts down server if true"""
        logger.info("Checking activity...")
        now = time()
        if (
            # Client count should be at least 1 since Python client should always be connected
            self.topics.get(CLIENTS_CONNECTED_TOPIC) in (0, 1)
            and now - self.last_client_count_update >= self.inactivity_threshold
        ):
            self.shutdown()

    def handler(self) -> None:
        """Main control loop"""
        self.client.loop()
        self.check_inactive()
