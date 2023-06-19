"""Pub/sub clients and common interface"""

import functools
from os import environ
from queue import Queue
from time import sleep

import paho.mqtt.client as paho_mqtt
from pika import ConnectionParameters, PlainCredentials, SelectConnection
from pika.exchange_type import ExchangeType

from logger import logger
from thread_handler import ThreadHandler

HOST = environ.get("HOST", "localhost")
PORT = int(environ.get("PORT", "5672"))
USERNAME = environ.get("USERNAME", "guest")
PASSWORD = environ.get("PASSWORD", "guest")


class PubSubClient:
    """Base class for pub/sub client.
    Derived classes should implement the methods defined in the base class."""

    def __init__(self, host: str, port, username: str = "", password: str = ""):
        self.host = host
        self.port = port
        self.username = username
        self.password = password

    def publish(self, topic: str, message: bytes) -> None:
        """Publish to topic"""
        logger.info("PubSub Client publishing message %s to topic %s", message, topic)

    def subscribe(self, topic: str) -> None:
        """Subscribe to topic"""
        logger.info("PubSub Client subscribing to topic %s", topic)


class MQTTClient(PubSubClient, ThreadHandler):
    """Threaded Paho MQTT client consumer"""

    def __init__(
        self,
        host: str,
        port: int,
        username: str = "",
        password: str = "",
        topics: list = [],
    ):
        PubSubClient.__init__(self, host, port, username, password)
        ThreadHandler.__init__(self, target=self.run)
        self.paho_mqtt_client = paho_mqtt.Client(client_id=username)
        self.paho_mqtt_client.username_pw_set(username, password)
        self.paho_mqtt_client.on_connect = self.on_connect
        self.paho_mqtt_client.on_message = self.on_message
        self.topics = topics
        self.messages = Queue()
        self.start()

    def on_connect(
        self, client: paho_mqtt.Client, userdata, flags, result_code
    ) -> None:
        """Callback for when the client receives a CONNACK response from the server
        Subscribing in on_connect() means that if we lose the connection and
        reconnect then subscriptions will be renewed.  Subscribe to config
        topic to receive requests for client configs"""

        logger.info("Connected to MQTT server with result code %s", result_code)

        for topic in self.topics:
            logger.info("Subscribing to %s topic", topic)
            self.paho_mqtt_client.subscribe(topic)

    def on_message(self, client: paho_mqtt.Client, userdata, mqtt_message) -> None:
        """Callback for when a message is received from the server, adds message
        to queue of received messages for consumption"""
        logger.info("Received MQTT message from topic %s", mqtt_message.topic)
        self.messages.put(mqtt_message.payload)

    def subscribe(self, topic: str) -> None:
        """MQTT client subscribes to messages published to topic"""
        self.paho_mqtt_client.subscribe(topic)

    def get_message(self) -> bytes:
        """Get a message from the queue of received messages.  If the queue is empty,
        block until a message is received and return the message."""
        self.messages.get()

    def publish(self, topic: str, message: bytes) -> None:
        """MQTT client publishes message to topic"""
        self.paho_mqtt_client.publish(topic, message)

    def run(self) -> None:
        """Run MQTT client"""
        self.paho_mqtt_client.loop()


# TODO type annotation
class RabbitMQClient:
    """This is based on the pika asynchronous consumer example found here:
    https://github.com/pika/pika/blob/main/examples/asynchronous_consumer_example.py.

    This is a RabbitMQ client that will handle unexpected interactions
    with RabbitMQ such as channel and connection closures.

    If RabbitMQ closes the connection, this class will stop and indicate
    that reconnection is necessary. You should look at the output, as
    there are limited reasons why the connection may be closed, which
    usually are tied to permission related issues or socket timeouts.

    If the channel is closed, it will indicate a problem with one of the
    commands that were issued and that should surface in the output as well.

    """

    def __init__(
        self,
        host: str,
        port: int,
        username: str = "",
        password: str = "",
        exchange: str = "message",
        exchange_type: ExchangeType = ExchangeType.topic,
        queue: str = "text",
        routing_key: str = "example.text",
        on_message_callback: callable = None,
    ):
        """Create a new instance of an asynchronous RabbitMQ consumer

        :param str host: Address of the RabbitMQ server
        :param int port: AMQP port of RabbitMQ server
        :param str username: username to authenticate with
        :param str password: password to authenticate with
        :param str exchange: exchange to setup after connecting
        :param str exchange_type: type of exchange to setup
        :param str queue: queue to bind to
        :param routing_key: routing key of messages in queue
        :param callable on_message_callback: optional function to be
            called when a message is received, must accept single
            argument of type bytes

        """
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.exchange = exchange
        self.exchange_type = exchange_type
        self.queue = queue
        self.routing_key = routing_key
        self.should_reconnect = False
        self.was_consuming = False
        self.connection = None
        self.channel = None
        self.closing = False
        self.consumer_tag = None
        self.consuming = False
        self.prefetch_count = 5
        self.on_message_callback = on_message_callback

    def connect(self):
        """This method connects to RabbitMQ, returning the connection handle.
        When the connection is established, the on_connection_open method
        will be invoked by pika.

        :rtype: pika.SelectConnection

        """
        logger.info("Connecting to %s:%d", self.host, self.port)
        return SelectConnection(
            ConnectionParameters(
                host=self.host,
                port=self.port,
                credentials=PlainCredentials(self.username, self.password),
            ),
            on_open_callback=self._on_connection_open,
            on_open_error_callback=self._on_connection_open_error,
            on_close_callback=self._on_connection_closed,
        )

    def close_connection(self):
        """This method is called by pika when the connection to RabbitMQ has closed."""
        self.consuming = False
        if self.connection.is_closing or self.connection.is_closed:
            logger.info("Connection is closing or already closed")
        else:
            logger.info("Closing connection")
            self.connection.close()

    def _on_connection_open(self, _unused_connection):
        """This method is called by pika once the connection to RabbitMQ has
        been established. It passes the handle to the connection object in
        case we need it, but in this case, we'll just mark it unused.

        :param pika.SelectConnection _unused_connection: The connection

        """
        logger.info("Connection opened")
        self.open_channel()

    def _on_connection_open_error(self, _unused_connection, err):
        """This method is called by pika if the connection to RabbitMQ
        can't be established.

        :param pika.SelectConnection _unused_connection: The connection
        :param Exception err: The error

        """
        logger.error("Connection open failed: %s", err)
        self.reconnect()

    def _on_connection_closed(self, _unused_connection, reason):
        """This method is invoked by pika when the connection to RabbitMQ is
        closed unexpectedly. Since it is unexpected, we will reconnect to
        RabbitMQ if it disconnects.

        :param pika.connection.Connection connection: The closed connection obj
        :param Exception reason: exception representing reason for loss of
            connection.

        """
        self.channel = None
        if self.closing:
            self.connection.ioloop.stop()
        else:
            logger.warning("Connection closed, reconnect necessary: %s", reason)
            self.reconnect()

    def reconnect(self):
        """Will be invoked if the connection can't be opened or is
        closed. Indicates that a reconnect is necessary then stops the
        ioloop.

        """
        self.should_reconnect = True
        self.stop()

    def open_channel(self):
        """Open a new channel with RabbitMQ by issuing the Channel.Open RPC
        command. When RabbitMQ responds that the channel is open, the
        on_channel_open callback will be invoked by pika.

        """
        logger.info("Creating a new channel")
        self.connection.channel(on_open_callback=self._on_channel_open)

    def _on_channel_open(self, channel):
        """This method is invoked by pika when the channel has been opened.
        The channel object is passed in so we can make use of it.

        Since the channel is now open, we'll declare the exchange to use.

        :param pika.channel.Channel channel: The channel object

        """
        logger.info("Channel opened")
        self.channel = channel
        self.add_on_channel_close_callback()
        self.setup_exchange(self.exchange)

    def add_on_channel_close_callback(self):
        """This method tells pika to call the on_channel_closed method if
        RabbitMQ unexpectedly closes the channel.

        """
        logger.info("Adding channel close callback")
        self.channel.add_on_close_callback(self._on_channel_closed)

    def _on_channel_closed(self, channel, reason):
        """Invoked by pika when RabbitMQ unexpectedly closes the channel.
        Channels are usually closed if you attempt to do something that
        violates the protocol, such as re-declare an exchange or queue with
        different parameters. In this case, we'll close the connection
        to shutdown the object.

        :param pika.channel.Channel: The closed channel
        :param Exception reason: why the channel was closed

        """
        logger.warning("Channel %i was closed: %s", channel, reason)
        self.close_connection()

    def setup_exchange(self, exchange_name):
        """Setup the exchange on RabbitMQ by invoking the Exchange.Declare RPC
        command. When it is complete, the on_exchange_declareok method will
        be invoked by pika.

        :param str|unicode exchange_name: The name of the exchange to declare

        """
        logger.info("Declaring exchange: %s", exchange_name)
        # Note: using functools.partial is not required, it is demonstrating
        # how arbitrary data can be passed to the callback when it is called
        on_exchange_declared = functools.partial(
            self._on_exchange_declareok, userdata=exchange_name
        )
        self.channel.exchange_declare(
            exchange=exchange_name,
            exchange_type=self.exchange_type,
            durable=True,
            callback=on_exchange_declared,
        )

    def _on_exchange_declareok(self, _unused_frame, userdata):
        """Invoked by pika when RabbitMQ has finished the Exchange.Declare RPC
        command.

        :param pika.Frame.Method unused_frame: Exchange.DeclareOk response frame
        :param str|unicode userdata: Extra user data (exchange name)

        """
        logger.info("Exchange declared: %s", userdata)
        self.setup_queue(self.queue)

    def setup_queue(self, queue_name):
        """Setup the queue on RabbitMQ by invoking the Queue.Declare RPC
        command. When it is complete, the on_queue_declareok method will
        be invoked by pika.

        :param str|unicode queue_name: The name of the queue to declare.

        """
        logger.info("Declaring queue %s", queue_name)
        on_queue_declared = functools.partial(
            self._on_queue_declareok, userdata=queue_name
        )
        self.channel.queue_declare(queue=queue_name, callback=on_queue_declared)

    def _on_queue_declareok(self, _unused_frame, userdata):
        """Method invoked by pika when the Queue.Declare RPC call made in
        setup_queue has completed. In this method we will bind the queue
        and exchange together with the routing key by issuing the Queue.Bind
        RPC command. When this command is complete, the on_bindok method will
        be invoked by pika.

        :param pika.frame.Method _unused_frame: The Queue.DeclareOk frame
        :param str|unicode userdata: Extra user data (queue name)

        """
        queue_name = userdata
        logger.info(
            "Binding %s to %s with %s", self.exchange, queue_name, self.routing_key
        )
        on_bind = functools.partial(self._on_bindok, userdata=queue_name)
        self.channel.queue_bind(
            queue_name, self.exchange, routing_key=self.routing_key, callback=on_bind
        )

    def _on_bindok(self, _unused_frame, userdata):
        """Invoked by pika when the Queue.Bind method has completed. At this
        point we will set the prefetch count for the channel.

        :param pika.frame.Method _unused_frame: The Queue.BindOk response frame
        :param str|unicode userdata: Extra user data (queue name)

        """
        logger.info("Queue bound: %s", userdata)
        self.set_qos()

    def set_qos(self):
        """This method sets up the consumer prefetch to only be delivered
        one message at a time. The consumer must acknowledge this message
        before RabbitMQ will deliver another one. You should experiment
        with different prefetch values to achieve desired performance.

        """
        self.channel.basic_qos(
            prefetch_count=self.prefetch_count, callback=self._on_basic_qos_ok
        )

    def _on_basic_qos_ok(self, _unused_frame):
        """Invoked by pika when the Basic.QoS method has completed. At this
        point we will start consuming messages by calling _start_consuming
        which will invoke the needed RPC commands to start the process.

        :param pika.frame.Method _unused_frame: The Basic.QosOk response frame

        """
        logger.info("QOS set to: %d", self.prefetch_count)
        self._start_consuming()

    def _start_consuming(self):
        """This method sets up the consumer by first calling
        add_on_cancel_callback so that the object is notified if RabbitMQ
        cancels the consumer. It then issues the Basic.Consume RPC command
        which returns the consumer tag that is used to uniquely identify the
        consumer with RabbitMQ. We keep the value to use it when we want to
        cancel consuming. The on_message method is passed in as a callback pika
        will invoke when a message is fully received.

        """
        logger.info("Issuing consumer related RPC commands")
        self.add_on_cancel_callback()
        self.consumer_tag = self.channel.basic_consume(self.queue, self._on_message)
        self.was_consuming = True
        self.consuming = True

    def add_on_cancel_callback(self):
        """Add a callback that will be invoked if RabbitMQ cancels the consumer
        for some reason. If RabbitMQ does cancel the consumer,
        on_consumer_cancelled will be invoked by pika.

        """
        logger.info("Adding consumer cancellation callback")
        self.channel.add_on_cancel_callback(self._on_consumer_cancelled)

    def _on_consumer_cancelled(self, method_frame):
        """Invoked by pika when RabbitMQ sends a Basic.Cancel for a consumer
        receiving messages.

        :param pika.frame.Method method_frame: The Basic.Cancel frame

        """
        logger.info("Consumer was cancelled remotely, shutting down: %r", method_frame)
        if self.channel:
            self.channel.close()

    def _on_message(self, _unused_channel, basic_deliver, properties, body):
        """Invoked by pika when a message is delivered from RabbitMQ. The
        channel is passed for your convenience. The basic_deliver object that
        is passed in carries the exchange, routing key, delivery tag and
        a redelivered flag for the message. The properties passed in is an
        instance of BasicProperties with the message properties and the body
        is the message that was sent.

        :param pika.channel.Channel _unused_channel: The channel object
        :param pika.Spec.Basic.Deliver: basic_deliver method
        :param pika.Spec.BasicProperties: properties
        :param bytes body: The message body

        """
        logger.info(
            "Received message # %s from %s",
            basic_deliver.delivery_tag,
            properties.app_id,
        )
        self.acknowledge_message(basic_deliver.delivery_tag)
        if self.on_message_callback is not None:
            self.on_message_callback(body)

    def acknowledge_message(self, delivery_tag):
        """Acknowledge the message delivery from RabbitMQ by sending a
        Basic.Ack RPC method for the delivery tag.

        :param int delivery_tag: The delivery tag from the Basic.Deliver frame

        """
        logger.info("Acknowledging message %s", delivery_tag)
        self.channel.basic_ack(delivery_tag)

    def stop_consuming(self):
        """Tell RabbitMQ that you would like to stop consuming by sending the
        Basic.Cancel RPC command.

        """
        if self.channel:
            logger.info("Sending a Basic.Cancel RPC command to RabbitMQ")
            on_cancel = functools.partial(self._on_cancelok, userdata=self.consumer_tag)
            self.channel.basic_cancel(self.consumer_tag, on_cancel)

    def _on_cancelok(self, _unused_frame, userdata):
        """This method is invoked by pika when RabbitMQ acknowledges the
        cancellation of a consumer. At this point we will close the channel.
        This will invoke the on_channel_closed method once the channel has been
        closed, which will in-turn close the connection.

        :param pika.frame.Method _unused_frame: The Basic.CancelOk frame
        :param str|unicode userdata: Extra user data (consumer tag)

        """
        self.consuming = False
        logger.info(
            "RabbitMQ acknowledged the cancellation of the consumer: %s", userdata
        )
        self.close_channel()

    def close_channel(self):
        """Call to close the channel with RabbitMQ cleanly by issuing the
        Channel.Close RPC command.

        """
        logger.info("Closing the channel")
        self.channel.close()

    def run(self):
        """Run the example consumer by connecting to RabbitMQ and then
        starting the IOLoop to block and allow the SelectConnection to operate.

        """
        self.connection = self.connect()
        self.connection.ioloop.start()

    def stop(self):
        """Cleanly shutdown the connection to RabbitMQ by stopping the consumer
        with RabbitMQ. When RabbitMQ confirms the cancellation, _on_cancelok
        will be invoked by pika, which will then closing the channel and
        connection. The IOLoop is started again because this method is invoked
        when CTRL-C is pressed raising a KeyboardInterrupt exception. This
        exception stops the IOLoop which needs to be running for pika to
        communicate with RabbitMQ. All of the commands issued prior to starting
        the IOLoop will be buffered but not processed.

        """
        if not self.closing:
            self.closing = True
            logger.info("Stopping")
            if self.consuming:
                self.stop_consuming()
                self.connection.ioloop.start()
            else:
                self.connection.ioloop.stop()
            logger.info("Stopped")

    def publish(self, topic: str, message: bytes):
        """Basic publish to RabbitMQ server.

        :param str topic: The topic to publish the message to
        :param bytes message: The message to publish

        """
        if self.consuming and not self.closing:
            self.channel.basic_publish(
                exchange=self.exchange, routing_key=topic, body=message
            )


class ReconnectingRabbitMQClient:
    """This is an example consumer that will reconnect if the nested
    ExampleConsumer indicates that a reconnect is necessary.

    """

    def __init__(
        self,
        host: str,
        port: int,
        username: str = "",
        password: str = "",
        exchange: str = "message",
        exchange_type: ExchangeType = ExchangeType.topic,
        queue: str = "text",
        routing_key: str = "example.text",
    ):
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.exchange = exchange
        self.exchange_type = exchange_type
        self.queue = queue
        self.routing_key = routing_key
        self.reconnect_delay = 0
        self.client = RabbitMQClient(
            host, port, username, password, exchange, exchange_type, queue, routing_key
        )

    def run(self):
        """Run RabbitMQ consumer"""
        while True:
            try:
                self.client.run()
            except KeyboardInterrupt:
                self.client.stop()
                break
            self._maybe_reconnect()

    def _maybe_reconnect(self):
        if self.client.should_reconnect:
            self.client.stop()
            reconnect_delay = self._get_reconnect_delay()
            logger.info("Reconnecting after %d seconds", reconnect_delay)
            sleep(reconnect_delay)
            self.client = RabbitMQClient(
                self.host,
                self.port,
                self.username,
                self.password,
                self.exchange,
                self.exchange_type,
                self.queue,
                self.routing_key,
            )

    def _get_reconnect_delay(self):
        if self.client.was_consuming:
            self.reconnect_delay = 0
        else:
            self.reconnect_delay += 1
        self.reconnect_delay = min(self.reconnect_delay, 30)
        return self.reconnect_delay

    def publish(self, topic: str, message: bytes):
        """Wrapper around RabbitMQClient publish.

        :param str topic: The topic to publish the message to
        :param bytes message: The message to publish

        """
        self.client.publish(topic, message)


def main():
    """Test reconnecting RabbitMQ client"""
    consumer = ReconnectingRabbitMQClient(HOST, PORT, USERNAME, PASSWORD)
    consumer.run()


if __name__ == "__main__":
    main()
