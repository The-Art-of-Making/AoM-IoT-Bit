import paho.mqtt.client as mqtt
from secrets import token_hex
from socket import create_connection
from ssl import SSLContext, PROTOCOL_TLS_CLIENT
from struct import pack, unpack
from uuid import uuid4

from logger import logger


class MQTTClient:
    """Client to connect to MQTT servers"""

    def __init__(
        self,
        server: str = "0.0.0.0",
        port: int = 1883,
        client_id: str = str(uuid4()),
        password: str = token_hex(),
        keep_alive: int = 60,
        cert_path: str = "/cert.pem",
        cert_hostname: str = "",
    ):
        self.server = server
        self.port = port
        self.client_id = client_id
        self.password = password
        self.keep_alive = keep_alive
        self.cert_path = cert_path  # path to SSL certificate for password server TLS
        self.cert_hostname = cert_hostname  # hostname used to generate SSL certificate for password server TLS
        self.client = mqtt.Client(client_id=self.client_id)
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.topics = {}
        self.connected = False

    def on_connect(self, client: mqtt.Client, userdata, flags, rc) -> None:
        """Callback for when client receives a CONNACK response from server"""
        logger.info("Connected with result code " + str(rc))
        self.connected = True
        # Subscribing in on_connect() means subscriptions will be renewed if connection lost and reconnect
        for topic in self.topics:
            client.subscribe(topic)

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
            if self.connected:
                self.client.subscribe(topic)

    def unsubscribe(self, topic: str) -> None:
        """Remove topic subscription"""
        if topic in self.topics:
            self.client.unsubscribe(topic)
            del self.topics[topic]

    def connect(self) -> bool:
        """Connect to MQTT broker"""
        logger.info("Attempting to connect to MQTT broker...")
        try:
            self.handle_password(
                operation="add",
                username=self.client_id,
                password=self.password,
                server_addr=self.server,
                cert_path=self.cert_path,
                cert_hostname=self.cert_hostname,
            )
            self.client.username_pw_set(self.client_id, self.password)
            self.client.connect(self.server, self.port, self.keep_alive)
            logger.info("Successfully connected to MQTT broker")
            return True
        except:
            logger.warning("Failed to connect to MQTT broker")
            return False

    @staticmethod
    def handle_password(
        operation: str,
        username: str = "",
        password: str = "",
        server_addr: str = "",
        server_port: int = 9443,
        cert_path: str = "/cert.pem",
        cert_hostname: str = "",
    ) -> bool:
        """Add/delete password MQTT server password; operation: 'add' or 'delete'"""
        context = SSLContext(PROTOCOL_TLS_CLIENT)
        context.load_verify_locations(cert_path)

        logger.info(f"Attempting to {operation} password for user {username}...")

        with create_connection((server_addr, server_port)) as client:
            with context.wrap_socket(client, server_hostname=cert_hostname) as tls:
                username_length = len(username)
                password_length = len(password)
                length = username_length + password_length
                if length > 255:  # single byte used to encode length
                    logger.warning("Username and/or password exceed length of 255")
                    return False
                send_data = 0b0
                if operation == "add":
                    send_data = pack(
                        f"=3B{username_length}s{password_length}s",
                        0x00,
                        0x0A,
                        length,
                        username.encode(),
                        password.encode(),
                    )
                if operation == "delete":
                    send_data = pack(
                        f"=3B{length}s", 0x00, 0x0D, length, username.encode()
                    )
                tls.sendall(send_data)
                recv_data = tls.recv(1024)
                server_header, server_operation, server_success = unpack(
                    "=3B", recv_data
                )
                if server_header != 0xFF or server_success != 0x00:
                    return False
                if operation == "add" and server_operation != 0x0A:
                    return False
                if operation == "delete" and server_operation != 0x0D:
                    return False
        logger.info(f"{operation} password for user {username} successful")
        return True
