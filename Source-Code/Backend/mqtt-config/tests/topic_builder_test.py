"""Test topic builder methods"""

from sys import path

from config_info import *

path.append("../application")
from topic_builder import (
    TOPICBUILDER_MQTT_DELIMITER,
    TOPICBUILDER_AMQP_DELIMITER,
    TopicBuilder_Route,
    TopicBuilder_ClientTopic,
    TopicBuilder_DeviceTopic,
    TopicBuilder_Context,
)

topic_builder = TopicBuilder_Context()


def test_client_topics():
    """Test creating client topics"""
    client_test_topic_prefix_mqtt = (
        "users/" + USER_UUID + "/clients/" + CLIENT_UUID + "/"
    )
    client_test_topic_prefix_amqp = (
        "users." + USER_UUID + ".clients." + CLIENT_UUID + "."
    )

    assert (
        topic_builder.clear_topic()
        .set_delimiter(TOPICBUILDER_MQTT_DELIMITER)
        .append_route(TopicBuilder_Route.TOPICBUILDER_ROUTE_USER, USER_UUID)
        .append_route(TopicBuilder_Route.TOPICBUILDER_ROUTE_CLIENT, CLIENT_UUID)
        .set_client_topic(TopicBuilder_ClientTopic.TOPICBUILDER_CLIENTTOPIC_STATUS)
        .get_topic()
        == client_test_topic_prefix_mqtt + "status"
    )

    assert (
        topic_builder.clear_topic()
        .set_delimiter(TOPICBUILDER_AMQP_DELIMITER)
        .append_route(TopicBuilder_Route.TOPICBUILDER_ROUTE_USER, USER_UUID)
        .append_route(TopicBuilder_Route.TOPICBUILDER_ROUTE_CLIENT, CLIENT_UUID)
        .set_client_topic(TopicBuilder_ClientTopic.TOPICBUILDER_CLIENTTOPIC_CONFIG)
        .get_topic()
        == client_test_topic_prefix_amqp + "config"
    )


def test_device_topics():
    """Test creating device topics"""
    device_test_topic_prefix_mqtt = (
        "users/"
        + USER_UUID
        + "/clients/"
        + CLIENT_UUID
        + "/devices/"
        + DEVICE_UUID
        + "/"
    )
    device_test_topic_prefix_amqp = (
        "users."
        + USER_UUID
        + ".clients."
        + CLIENT_UUID
        + ".devices."
        + DEVICE_UUID
        + "."
    )

    assert (
        topic_builder.clear_topic()
        .set_delimiter(TOPICBUILDER_MQTT_DELIMITER)
        .append_route(TopicBuilder_Route.TOPICBUILDER_ROUTE_USER, USER_UUID)
        .append_route(TopicBuilder_Route.TOPICBUILDER_ROUTE_CLIENT, CLIENT_UUID)
        .append_route(TopicBuilder_Route.TOPICBUILDER_ROUTE_DEVICE, DEVICE_UUID)
        .set_device_topic(TopicBuilder_DeviceTopic.TOPICBUILDER_DEVICETOPIC_STATUS)
        .get_topic()
        == device_test_topic_prefix_mqtt + "status"
    )

    assert (
        topic_builder.clear_topic()
        .set_delimiter(TOPICBUILDER_AMQP_DELIMITER)
        .append_route(TopicBuilder_Route.TOPICBUILDER_ROUTE_USER, USER_UUID)
        .append_route(TopicBuilder_Route.TOPICBUILDER_ROUTE_CLIENT, CLIENT_UUID)
        .append_route(TopicBuilder_Route.TOPICBUILDER_ROUTE_DEVICE, DEVICE_UUID)
        .set_device_topic(TopicBuilder_DeviceTopic.TOPICBUILDER_DEVICETOPIC_CONFIG)
        .get_topic()
        == device_test_topic_prefix_amqp + "config"
    )

    assert (
        topic_builder.clear_topic()
        .set_delimiter(TOPICBUILDER_MQTT_DELIMITER)
        .append_route(TopicBuilder_Route.TOPICBUILDER_ROUTE_USER, USER_UUID)
        .append_route(TopicBuilder_Route.TOPICBUILDER_ROUTE_CLIENT, CLIENT_UUID)
        .append_route(TopicBuilder_Route.TOPICBUILDER_ROUTE_DEVICE, DEVICE_UUID)
        .set_device_topic(TopicBuilder_DeviceTopic.TOPICBUILDER_DEVICETOPIC_STATE)
        .get_topic()
        == device_test_topic_prefix_mqtt + "state"
    )

    assert (
        topic_builder.clear_topic()
        .set_delimiter(TOPICBUILDER_AMQP_DELIMITER)
        .append_route(TopicBuilder_Route.TOPICBUILDER_ROUTE_USER, USER_UUID)
        .append_route(TopicBuilder_Route.TOPICBUILDER_ROUTE_CLIENT, CLIENT_UUID)
        .append_route(TopicBuilder_Route.TOPICBUILDER_ROUTE_DEVICE, DEVICE_UUID)
        .set_device_topic(TopicBuilder_DeviceTopic.TOPICBUILDER_DEVICETOPIC_CMD)
        .get_topic()
        == device_test_topic_prefix_amqp + "cmd"
    )
