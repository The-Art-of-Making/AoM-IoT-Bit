"""Handle various actions related to MQTT servers"""

from queue import Queue
from time import sleep, time
import paho.mqtt.client as mqtt

from logger import logger
from thread_handler import ThreadHandler


class MQTTMessage:
    """MQTTMessage properties"""

    def __init__(
        self,
        host: str,
        port: int,
        topic: str,
        payload: bytes,
        qos: int = 1,
        retain: bool = False,
    ):
        self.host = host
        self.port = port
        self.topic = topic
        self.payload = payload
        self.qos = qos
        if self.qos not in (0, 1, 2):
            self.qos = 1
        self.retain = retain


class MQTTPublisher:
    """Publish MQTT messages to individual MQTT server"""

    def __init__(
        self,
        host: str,
        port: int,
        message: MQTTMessage,
        username: str = "",
        password: str = "",
        timeout: int = 15,
        attempts: int = 5,
    ):
        self.mqtt_client = mqtt.Client(client_id=username)
        self.mqtt_client.username_pw_set(username, password)
        self.mqtt_client.on_connect = self.on_connect
        self.host = host
        self.port = port
        self.message = message
        self.timeout = timeout
        self.attempts = attempts
        self.complete = False

    def on_connect(self, client: mqtt.Client, userdata, flags, result_code):
        """Callback to publish device config upon successfully connecting to MQTT server"""
        message = self.message
        if result_code == 0:
            logger.info("Successfully connected to MQTT server %s", self.host)
            client.publish(
                message.topic,
                payload=message.payload,
                qos=message.qos,
                retain=message.retain,
            )
            logger.info(
                "Successfully published message %s to topic %s",
                str(message.payload),
                message.topic,
            )
        else:
            logger.warning("Connected to MQTT server with result code %d", result_code)
            logger.warning(
                "Failed to publish message %s to server %s",
                str(message.payload),
                self.host,
            )
        self.complete = True

    def publish(self) -> None:
        """Connect to MQTT server and publish message"""
        attempts = 0
        while attempts < self.attempts:
            logger.info("Attempting to connect to MQTT server, attempt %d", attempts)
            try:
                self.mqtt_client.connect(self.host, self.port, self.timeout)
                self.mqtt_client.loop_start()
                timeout = time() + self.timeout
                while time() < timeout and not self.complete:
                    sleep(0.1)
                self.mqtt_client.loop_stop()
                self.mqtt_client.disconnect()
                break
            except:
                # TODO better delay method needed
                # ~15s delay to give RabbitMQ time to initialize
                sleep(15)
            attempts += 1
        if attempts == self.attempts:
            logger.warning(
                "Failed to connect to MQTT server at %s:%d and publish message",
                self.host,
                self.port,
            )


class MQTTMultiPublisher(ThreadHandler):
    def __init__(self, username: str = "", password: str = ""):
        super().__init__(target=self.handle_messages)
        self.username = username
        self.password = password
        self.message_queue = Queue()
        self.start()

    def publish(self, message: MQTTMessage) -> bool:
        """Queue message for publishing"""
        if not self.running:
            return False
        self.message_queue.put(message)
        return True

    def handle_messages(self):
        """Start PublisherThreads for each unique host in message queue"""
        while not self.message_queue.empty():
            message = self.message_queue.get()
            mqtt_publisher = MQTTPublisher(
                host=message.host,
                port=message.port,
                message=message,
                username=self.username,
                password=self.password,
            )
            # TODO non-blocking publishing, limit number of re-connections
            mqtt_publisher.publish()
