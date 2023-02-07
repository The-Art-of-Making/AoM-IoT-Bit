from os import environ
import pika
from queue import Queue

from logger import logger
from thread_handler import ThreadHandler

rabbitmq_addr = environ.get(
    "RABBITMQ_ADDR",
    "localhost",
)
rabbitmq_port = environ.get("RABBITMQ_PORT", "5672")


class RabbitMQHandler:
    """Connect and disconnect from a RabbitMQ cluster"""

    def __init__(
        self, queue: str, username: str = "", password: str = "", heartbeat: int = 30
    ):
        self.queue = queue
        try:
            self.rabbitmq_connection = pika.BlockingConnection(
                pika.ConnectionParameters(
                    host=rabbitmq_addr,
                    port=int(rabbitmq_port),
                    # TODO fix plain authentication
                    # credentials=pika.PlainCredentials(self.username, self.password),
                    heartbeat=heartbeat,
                )
            )
            self.rabbitmq_channel = self.rabbitmq_connection.channel()
            self.rabbitmq_channel.queue_declare(queue=self.queue)
        except Exception as exception:
            logger.warning("Error " + str(exception) + " when connecting to RabbitMQ")

    def disconnect(self) -> bool:
        """Disconnect MessageHandler from rabbitmq cluster"""
        try:
            if self.rabbitmq_connection.is_open:
                self.rabbitmq_connection.close()
        except Exception as exception:
            logger.warning(
                "Error " + str(exception) + " when disconnecting from RabbitMQ"
            )
            return False
        return True


class RabbitMQConsumer(RabbitMQHandler, ThreadHandler):
    """Threaded RabbitMQ Consumer"""

    def __init__(self, queue: str, username: str = "", password=""):
        RabbitMQHandler.__init__(queue=queue, username=username, password=password)
        ThreadHandler.__init__(target=self.consume)
        self.messages = Queue()
        self.start()

    def disconnect(self) -> bool:
        """Stop consumer and disconnect from RabbitMQ"""
        self.stop()
        return super().disconnect()

    def on_message_callback(self, channel, method, properties, body):
        """Put message into message queue when message received"""
        if body is not None:
            logger.info("Received message " + str(body))
            self.messages.put(body)

    def consume(self):
        """Consume messages from RabbitMQ cluster"""
        self.rabbitmq_channel.basic_consume(
            queue=self.queue,
            on_message_callback=self.on_message_callback,
            auto_ack=True,
        )

    def get_message(self) -> bytes:
        """Get message from message queue"""
        if self.messages.empty():
            return b""
        return self.messages.get()


class RabbitMQPublisher(RabbitMQHandler, ThreadHandler):
    """Threaded RabbitMQ Publisher"""

    def __init__(self, queue: str, username: str = "", password=""):
        RabbitMQHandler.__init__(queue=queue, username=username, password=password)
        ThreadHandler.__init__(target=self.publish)
        self.messages = Queue()
        self.start()

    def disconnect(self) -> bool:
        """Stop publisher and disconnect from RabbitMQ"""
        self.stop()
        return super().disconnect()

    def put_message(self, message: bytes) -> None:
        """Put message in message queue to be publised"""
        self.messages.put(bytes(message))

    def publish(self) -> None:
        """Publish messages from message queue to RabbitMQ"""
        if not self.messages.empty():
            self.rabbitmq_channel.basic_publish(
                exchange="", routing_key=self.queue, body=self.messages.get()
            )
