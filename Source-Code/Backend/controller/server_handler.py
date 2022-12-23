import paho.mqtt.client as mqtt
from time import sleep, time

from database_handler import create_server, delete_server
from kubernetes_handler import (
    get_pods,
    create_namespace,
    delete_namespace,
    create_deployment,
    delete_deployment,
)
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
        self.uuid = ""
        self.user = user
        self.deployment_name = ""
        self.server_info = {
            "user": self.user
        }  # TODO refactor class so uuid and user are accessed from server_info
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
            create_namespace(self.user)
            self.deployment_name = create_deployment(
                "mqtt-deployment.yaml", namespace=self.user
            )  # create Kubernetes deployment
            sleep(0.1)  # Need time to create container?
            # Get information from pods in deployment
            pods = get_pods(namespace=self.user)
            pod_count = 0
            for pod in pods.items:
                pod_count += 1
                if pod_count > 1:  # each deployment should only have a single pod
                    self.shutdown(handle_db=False)
                    assert False
                self.server_info["name"] = pod.metadata.name
                self.server_info["uuid"] = pod.metadata.uid
                self.server_info[
                    "addr"
                ] = ""  # pod.status.pod_ip, ip address is not immediately assigned
                self.server_info["port"] = 1883  # TODO dynamically set port?
                self.uuid = pod.metadata.uid
            if create_server(self.server_info):  # Create database entry
                logger.info(f"Server {self.uuid} started")
                # self.client.connect(
                #     self.server_info["addr"], self.server_info["port"], 60
                # )  # connect MQTT client
                logger.info(f"Running server {self.uuid} handler")
                self.start()
            else:
                self.shutdown(handle_db=False)
        except:
            logger.warning("Failed to start sever")
            return False
        return True

    def shutdown(self, handle_db: bool = True) -> None:
        """Stutdown MQTT server"""
        logger.info("Stopping server...")
        self.running = False
        delete_deployment(self.deployment_name, namespace=self.user)
        delete_namespace(self.user)
        if handle_db:
            delete_server(self.uuid)

    def update_client_count(self, count: int) -> None:
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
        # TODO need new service to update server info as it is populated
        self.client.loop()
        self.check_inactive()
