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
    TopicBuilder_DeviceTopic,
    TopicBuilder_Context,
)
from config_handler import get_time_ms

path.append("../../../cml/out/python")
import payload_pb2
from client import client_inner_payload_pb2, client_config_pb2
from device import device_inner_payload_pb2, device_config_pb2

topic_builder = TopicBuilder_Context()

count = 0

CONFIG_TOPIC = (
    topic_builder.clear_topic()
    .set_delimiter(TOPICBUILDER_MQTT_DELIMITER)
    .append_route(TopicBuilder_Route.TOPICBUILDER_ROUTE_USER, USER_UUID)
    .append_route(TopicBuilder_Route.TOPICBUILDER_ROUTE_CLIENT, CLIENT_UUID)
    .set_client_topic(TopicBuilder_ClientTopic.TOPICBUILDER_CLIENTTOPIC_CONFIG)
    .get_topic()
)
CMD_TOPIC = (
    topic_builder.clear_topic()
    .set_delimiter(TOPICBUILDER_MQTT_DELIMITER)
    .append_route(TopicBuilder_Route.TOPICBUILDER_ROUTE_USER, USER_UUID)
    .append_route(TopicBuilder_Route.TOPICBUILDER_ROUTE_CLIENT, CLIENT_UUID)
    .append_route(TopicBuilder_Route.TOPICBUILDER_ROUTE_DEVICE, DEVICE_UUID)
    .set_device_topic(TopicBuilder_DeviceTopic.TOPICBUILDER_DEVICETOPIC_CMD)
    .get_topic()
)
STATE_TOPIC = (
    topic_builder.clear_topic()
    .set_delimiter(TOPICBUILDER_MQTT_DELIMITER)
    .append_route(TopicBuilder_Route.TOPICBUILDER_ROUTE_USER, USER_UUID)
    .append_route(TopicBuilder_Route.TOPICBUILDER_ROUTE_CLIENT, CLIENT_UUID)
    .append_route(TopicBuilder_Route.TOPICBUILDER_ROUTE_DEVICE, DEVICE_UUID)
    .set_device_topic(TopicBuilder_DeviceTopic.TOPICBUILDER_DEVICETOPIC_STATE)
    .get_topic()
)
STATUS_TOPIC = (
    topic_builder.clear_topic()
    .set_delimiter(TOPICBUILDER_MQTT_DELIMITER)
    .append_route(TopicBuilder_Route.TOPICBUILDER_ROUTE_USER, USER_UUID)
    .append_route(TopicBuilder_Route.TOPICBUILDER_ROUTE_CLIENT, CLIENT_UUID)
    .append_route(TopicBuilder_Route.TOPICBUILDER_ROUTE_DEVICE, DEVICE_UUID)
    .set_device_topic(TopicBuilder_DeviceTopic.TOPICBUILDER_DEVICETOPIC_STATUS)
    .get_topic()
)


def on_connect(client: mqtt.Client, userdata, flags, rc):
    """Callback for when the client receives a CONNACK response from the server"""
    print("Connected with result code " + str(rc))

    # Subscribing in on_connect() means that if we lose the connection and
    # reconnect then subscriptions will be renewed.
    client.subscribe(CONFIG_TOPIC)
    client.subscribe(CMD_TOPIC)

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
        if msg.topic == CONFIG_TOPIC:
            print(payload.client_inner_payload)
            assert payload.type == payload_pb2.SET
            assert payload.ack == payload_pb2.INBOUND
            assert payload.inner_payload_type == payload_pb2.CLIENT

            # Set device status
            device_status_payload = payload_pb2.Payload()
            device_status_payload.type = payload_pb2.SET
            device_status_payload.ack = payload_pb2.OUTBOUND
            device_status_payload.inner_payload_type = payload_pb2.DEVICE
            device_status_payload.timestamp = get_time_ms()
            device_status_payload.device_inner_payload.type = (
                device_inner_payload_pb2.STATUS
            )
            device_status_payload.device_inner_payload.status.status = "Connected"
            client.publish(
                STATUS_TOPIC, device_status_payload.SerializeToString(), 1, True
            )

        if msg.topic == CMD_TOPIC:
            print(payload.device_inner_payload)
            assert payload.type == payload_pb2.SET
            assert payload.ack == payload_pb2.OUTBOUND
            assert payload.inner_payload_type == payload_pb2.DEVICE
            response = payload_pb2.Payload()
            response.CopyFrom(payload)
            response.ack = payload_pb2.INBOUND
            response.timestamp = get_time_ms()
            client.publish(STATE_TOPIC, response.SerializeToString(), 1, True)


client = mqtt.Client(client_id=CLIENT_UUID)
client.username_pw_set(
    CLIENT_UUID,
    CLIENT_TOKEN,
)
client.on_connect = on_connect
client.on_message = on_message

# Set last will
device_status_payload = payload_pb2.Payload()
device_status_payload.type = payload_pb2.SET
device_status_payload.ack = payload_pb2.OUTBOUND
device_status_payload.inner_payload_type = payload_pb2.DEVICE
device_status_payload.timestamp = get_time_ms()
device_status_payload.device_inner_payload.type = device_inner_payload_pb2.STATUS
device_status_payload.device_inner_payload.status.status = "Disconnected"
client.will_set(STATUS_TOPIC, device_status_payload.SerializeToString(), 1, True)

client.connect(SERVER_IP, 1883, 60)

client.loop_forever()
