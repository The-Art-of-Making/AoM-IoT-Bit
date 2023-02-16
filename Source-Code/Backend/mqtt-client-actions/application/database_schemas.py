from mongoengine import Document, EmbeddedDocument, EmbeddedDocumentField
from mongoengine.fields import DateTimeField, IntField, MapField, StringField

# TODO generate python schemas from javascript schemas


class ServerStates:
    """Server states"""

    WAITING = "WAITING"
    STARTING = "STARTING"
    RUNNING = "RUNNING"
    SHUTTING_DOWN = "SHUTTING DOWN"
    SHUTDOWN = "SHUTDOWN"
    ERROR = "ERROR"

    STATES = [WAITING, STARTING, RUNNING, SHUTTING_DOWN, SHUTDOWN, ERROR]


class web_users(Document):
    """Define user schema"""

    email = StringField(required=True, unique=True, trim=True)
    password = StringField(required=True, min_length=8)
    date = DateTimeField()


class mqtt_clients(Document):
    """Define client schema"""

    name = StringField(required=True, trim=True)
    user = StringField(required=True, trim=True)
    username = StringField(required=True, unique=True, trim=True)
    password = StringField(required=True, trim=True)
    ip_addr = StringField(trim=True)


class device_action(EmbeddedDocument):
    """Define device action schema"""

    action = StringField(required=True, trim=True)
    trigger_topic = StringField(required=True)
    trigger_state = IntField(required=True)
    response = IntField(required=True)


class mqtt_devices(Document):
    """Define device schema"""

    user = StringField(required=True, trim=True)
    client_name = StringField(required=True, trim=True)
    client_username = StringField(required=True, trim=True)
    name = StringField(required=True, trim=True)
    number = IntField(required=True)
    io = StringField(required=True, choices=["input", "output"])
    signal = StringField(required=True, choices=["digital", "analog"])
    actions = MapField(EmbeddedDocumentField(device_action), required=False)


class mqtt_servers(Document):
    """Define server schema"""

    user = StringField(required=True, unique=True, trim=True)
    name = StringField()
    status = StringField(required=True, choices=ServerStates.STATES)
    uid = StringField(unique=True, trim=True)
    addr = StringField()
    port = IntField()
    client_count = IntField(required=True, default=0)


class mqtt_controllers(Document):
    """Define controller schema"""

    username = StringField(required=True, unique=True, trim=True)
    password = StringField(required=True, trim=True)
