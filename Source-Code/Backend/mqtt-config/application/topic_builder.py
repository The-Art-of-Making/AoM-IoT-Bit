"""Build MQTT topics"""

from enum import Enum

TOPICBUILDER_MQTT_DELIMITER = "/"
TOPICBUILDER_AMQP_DELIMITER = "."


class TopicBuilder_Route(Enum):
    """Route indexes"""

    TOPICBUILDER_ROUTE_USER = 0
    TOPICBUILDER_ROUTE_CLIENT = 1
    TOPICBUILDER_ROUTE_DEVICE = 2


class TopicBuilder_ClientTopic(Enum):
    """Client topic indexes"""

    TOPICBUILDER_CLIENTTOPIC_STATUS = 0
    TOPICBUILDER_CLIENTTOPIC_CONFIG = 1


class TopicBuilder_DeviceTopic(Enum):
    """Device topic indexes"""

    TOPICBUILDER_DEVICETOPIC_STATUS = 0
    TOPICBUILDER_DEVICETOPIC_CONFIG = 1
    TOPICBUILDER_DEVICETOPIC_STATE = 2
    TOPICBUILDER_DEVICETOPIC_CMD = 3


TopicBuilder_Routes = ("users", "clients", "devices")
TopicBuilder_ClientTopics = ("status", "config")
TopicBuilder_DeviceTopics = ("status", "config", "state", "cmd")


class TopicBuilder_Context:
    """Context for building topics"""

    def __init__(self, delimiter: str = TOPICBUILDER_MQTT_DELIMITER):
        self.topic = ""
        self.delimiter = delimiter

    def append(self, data: str = ""):  # TODO type annotation for self
        """Append string data to topic"""
        if len(self.topic) > 0:
            self.topic += self.delimiter
        self.topic += data
        return self

    def clear_topic(self):  # TODO type annotation for self
        """Clear context topic"""
        self.topic = ""
        return self

    def get_topic(self) -> str:
        """Get context topic"""
        return self.topic

    def set_delimiter(
        self, delimiter: str = TOPICBUILDER_MQTT_DELIMITER
    ):  # TODO type annotation for self
        """Set topic delimiter"""
        self.delimiter = delimiter
        return self

    def append_route(
        self, topic_builder_route: TopicBuilder_Route, data: str
    ):  # TODO type annotation for self
        "Append route data to topic"
        if topic_builder_route in TopicBuilder_Route:
            self.append(TopicBuilder_Routes[topic_builder_route.value]).append(data)
        return self

    def set_client_topic(
        self, topic_builder_client_topic: TopicBuilder_ClientTopic
    ):  # TODO type annotation for self
        """Set client topic route correspoding to client topic type"""
        if topic_builder_client_topic in TopicBuilder_ClientTopic:
            self.append(TopicBuilder_ClientTopics[topic_builder_client_topic.value])
        return self

    def set_device_topic(
        self, topic_builder_device_topic: TopicBuilder_DeviceTopic
    ):  # TODO type annotation for self
        """Set device topic route correspoding to device topic type"""
        if topic_builder_device_topic in TopicBuilder_DeviceTopic:
            self.append(TopicBuilder_DeviceTopics[topic_builder_device_topic.value])
        return self
