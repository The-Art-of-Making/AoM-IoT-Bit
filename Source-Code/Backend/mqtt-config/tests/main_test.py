from os import environ
import paho.mqtt.client as mqtt
from sys import path
from google.protobuf.json_format import ParseDict

from config_handler_tests import (
    build_client_inner_payload_get_config,
    CLIENT_CONFIG_PAYLOAD_GET,
    CLIENT_CONFIG_INNER_PAYLOAD,
)
from config_info import *

path.append("../application")
from topic_builder import (
    TOPICBUILDER_MQTT_DELIMITER,
    TopicBuilder_Route,
    TopicBuilder_ClientTopic,
    TopicBuilder_Context,
)
from config_handler import get_time_ms

path.append("../../../cml/out/python")
import payload_pb2
from client import inner_payload_pb2 as client_inner_payload_pb2
from client import config_pb2 as client_config_pb2
from device import inner_payload_pb2 as device_inner_payload_pb2
from device import config_pb2 as device_config_pb2

topic_builder = TopicBuilder_Context()

count = 0


def on_connect(client: mqtt.Client, userdata, flags, rc):
    """Callback for when the client receives a CONNACK response from the server"""
    print("Connected with result code " + str(rc))

    # Subscribing in on_connect() means that if we lose the connection and
    # reconnect then subscriptions will be renewed.
    config_topic = (
        topic_builder.clear_topic()
        .set_delimiter(TOPICBUILDER_MQTT_DELIMITER)
        .append_route(TopicBuilder_Route.TOPICBUILDER_ROUTE_USER, USER_UUID)
        .append_route(TopicBuilder_Route.TOPICBUILDER_ROUTE_CLIENT, CLIENT_UUID)
        .set_client_topic(TopicBuilder_ClientTopic.TOPICBUILDER_CLIENTTOPIC_CONFIG)
        .get_topic()
    )
    client.subscribe(config_topic)

    # Get client config
    payload = payload_pb2.Payload()
    ParseDict(CLIENT_CONFIG_PAYLOAD_GET, payload)
    payload.timestamp = get_time_ms()
    payload.client_inner_payload.CopyFrom(build_client_inner_payload_get_config())
    client.publish(MQTT_CONFIG_TOPIC, payload.SerializeToString())


def on_message(client, userdata, msg):
    """Callback for when message is received from the server"""
    global count
    print(f"Message: {count}")
    print(msg.topic + " " + str(msg.payload))
    print("-----------------------------------------------------")
    count += 1

    # Parse response
    payload = payload_pb2.Payload()
    if payload.ParseFromString(msg.payload) != 0:
        assert payload.type == payload_pb2.SET
        assert payload.ack == payload_pb2.INBOUND
        assert payload.inner_payload_type == payload_pb2.CLIENT
        print(payload.client_inner_payload)


client = mqtt.Client(client_id=CLIENT_UUID)
client.username_pw_set(
    CLIENT_UUID,
    CLIENT_TOKEN,
)
client.on_connect = on_connect
client.on_message = on_message
client.connect(SERVER_IP, 1883, 60)

client.loop_forever()
