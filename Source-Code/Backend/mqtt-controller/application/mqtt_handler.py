import paho.mqtt.client as mqtt
from time import sleep, time

from logger import logger
from thread_handler import ThreadHandler


class MQTTPublisher(ThreadHandler):
    """Separate thread to publish message to MQTT server topic"""

    def __init__(
        self,
        host: str,
        port: int,
        topic: str,
        message: bytes,
        qos: int = 1,
        retain: bool = False,
        username: str = "",
        password: str = "",
        timeout: int = 15,
        attempts: int = 3,
    ):
        super().__init__(target=self.publish)
        self.mqtt_client = mqtt.Client(client_id=username)
        self.mqtt_client.username_pw_set(username, password)
        self.mqtt_client.on_connect = self.on_connect
        self.host = host
        self.port = port
        self.topic = topic
        self.message = message
        self.qos = qos
        if self.qos not in (0, 1, 2):
            self.qos = 1
        self.retain = retain
        self.timeout = timeout
        self.attempts = attempts
        self.complete = False
        self.start(loop=False)

    def on_connect(self, client: mqtt.Client, userdata, flags, result_code):
        """Callback to publish device config upon successfully connecting to MQTT server"""
        if result_code == 0:
            logger.info(f"Successfully connected to MQTT server")
            client.publish(
                self.topic, payload=self.message, qos=self.qos, retain=self.retain
            )
            logger.info(
                f"Successfully published message {self.message} to topic {self.topic}"
            )
        else:
            logger.warning(f"Connected to MQTT server with result code {result_code}")
            logger.warning(
                f"Failed to publish message {self.message} to topic {self.topic}"
            )
        self.complete = True

    def publish(self) -> None:
        """Connect to MQTT server and publish message"""
        attempts = 0
        while attempts < self.attempts:
            logger.info(f"Attempting to connect to MQTT server, attempt {attempts}")
            try:
                self.mqtt_client.connect(self.host, self.port, self.timeout)
                self.mqtt_client.loop_start()
                timeout = time() + self.timeout
                while time() < timeout and not self.complete:
                    sleep(0.1)
                self.mqtt_client.loop_stop()
                break
            except:
                # TODO better delay method needed
                # ~15s delay to give RabbitMQ time to initialize
                sleep(15)
            attempts += 1
        if attempts == 3:
            logger.warning(
                f"Failed to connect to MQTT server at {self.host}:{self.port} and publish message {self.message} to topic {self.topic}"
            )
