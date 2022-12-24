"""Server Handler"""

import paho.mqtt.client as mqtt
from socket import create_connection
from ssl import SSLContext, PROTOCOL_TLS_CLIENT
from struct import pack, unpack
from time import time

from database_handler import create_server, update_server, delete_server
from kubernetes_handler import (
    get_pods,
    create_namespace,
    delete_namespace,
    create_deployment,
    delete_deployment,
)
from logger import logger
from thread_handler import ThreadHandler

"""Password server message format"""
# Client format: 0x00 | 0X0A/0x0D | length | username | password
# Server format: 0xFF | 0x0A/0x0D | 0x00/0x01
# 0x00 : Client Header
# 0xFF : Server Header
# 0x0A/0x0D : Add/Delete password
# length : combined length of username and password, does not include length byte itself, single byte cannot store values > 255
# 0x00/0x01 : Success/Fail


PASSWORD_SERVER_CERT_HOSTNAME = (
    "delta12"  # hostname used to generate SSL certificate for password server TLS
)
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
        self.server_info = {"user": user}
        self.deployment_name = ""
        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.topics = {}
        self.inactivity_threshold = inactivity_threshold
        self.last_client_count_update = time()
        self.start_server()

    def get_field(self, field: str):  # TODO return type annotation?
        """Get server field info"""
        self.server_info.get(field)

    def update_field(self, field: str, value) -> None:
        """Update server field value, can only be called after entry created in database"""
        self.server_info[field] = value
        update_server(self.get_field("uuid"), self.server_info)

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
            create_namespace(self.get_field("user"))
            self.deployment_name = create_deployment(
                "mqtt-deployment.yaml", namespace=self.get_field("user")
            )  # create Kubernetes deployment
            # Get information from pods in deployment
            pods = get_pods(namespace=self.get_field("user"))
            pod_count = 0
            for pod in pods.items:
                pod_count += 1
                if pod_count > 1:  # each deployment should only have a single pod
                    self.shutdown(handle_db=False)
                    assert False
                # Wait for pod to be created
                while None in (
                    pod.metadata.name,
                    pod.metadata.uid,
                    pod.metadata.uid,
                    pod.status.pod_ip,
                ):
                    continue
                self.server_info["name"] = pod.metadata.name
                self.server_info["uuid"] = pod.metadata.uid
                self.server_info["addr"] = pod.status.pod_ip
                self.server_info["port"] = 1883  # TODO dynamically set port?
            if create_server(self.server_info):  # Create database entry
                logger.info(f"Starting server {self.uuid} and handler")
                # TODO connect to mqtt client
                #  self.client.connect(
                #     self.server_info["addr"], self.server_info["port"], 60
                # )  # connect MQTT client
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
        delete_deployment(self.deployment_name, namespace=self.get_field("user"))
        delete_namespace(self.get_field("user"))
        if handle_db:
            delete_server(self.uuid)

    def add_password(
        self,
        username: str,
        password: str,
        hostname: str = PASSWORD_SERVER_CERT_HOSTNAME,
        port: int = 9443,
        cert: str = "cert.pem",
    ) -> bool:
        """Add password to MQTT server password file"""
        context = SSLContext(PROTOCOL_TLS_CLIENT)
        context.load_verify_locations(cert)

        with create_connection((self.get_field("addr"), port)) as client:
            with context.wrap_socket(client, server_hostname=hostname) as tls:
                username_length = len(username)
                password_length = len(password)
                length = username_length + password_length
                if length > 255:  # single byte used to encode length
                    return False
                send_data = pack(
                    f"=3B{username_length}s{password_length}s",
                    0x00,
                    0x0A,
                    length,
                    username.encode(),
                    password.encode(),
                )
                tls.sendall(send_data)
                recv_data = tls.recv(1024)
                server_header, operation, success = unpack("=3B", recv_data)
                if server_header != 0xFF or operation != 0x0A or success != 0x00:
                    return False
        return True

    def delete_password(
        self,
        username: str,
        hostname: str = PASSWORD_SERVER_CERT_HOSTNAME,
        port: int = 9443,
        cert: str = "cert.pem",
    ) -> bool:
        """Remove password from MQTT server password file"""
        context = SSLContext(PROTOCOL_TLS_CLIENT)
        context.load_verify_locations(cert)

        with create_connection((self.get_field("addr"), port)) as client:
            with context.wrap_socket(client, server_hostname=hostname) as tls:
                length = len(username)
                if length > 255:  # single byte used to encode length
                    return False
                send_data = pack(f"=3B{length}s", 0x00, 0x0D, length, username.encode())
                tls.sendall(send_data)
                recv_data = tls.recv(1024)
                server_header, operation, success = unpack("=3B", recv_data)
                if server_header != 0xFF or operation != 0x0D or success != 0x00:
                    return False
        return True

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
        self.client.loop()
        self.check_inactive()
