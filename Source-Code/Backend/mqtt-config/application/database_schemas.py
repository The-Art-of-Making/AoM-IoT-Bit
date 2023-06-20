"""Document schemas for MonogDB database for AoM IoT Bit"""

from mongoengine import Document
from mongoengine.fields import DateTimeField, IntField, MapField, StringField


class web_users(Document):
    """Define user schema"""

    email = StringField(required=True, unique=True, trim=True)
    password = StringField(required=True, min_length=8)
    uuid = StringField(required=True, unique=True, trim=True, min_length=36)
    date = DateTimeField()


class mqtt_services(Document):
    """Define controller schema"""

    uuid = StringField(required=True, unique=True, trim=True, min_length=36)
    token = StringField(required=True, trim=True)


class mqtt_clients(Document):
    """Define client schema"""

    name = StringField(required=True, trim=True)
    uuid = StringField(required=True, unique=True, trim=True, min_length=36)
    token = StringField(required=True, trim=True)
    user_uuid = StringField(required=True, trim=True, min_length=36)
    lan_ip = StringField(trim=True)
    wan_ip = StringField(trim=True)


class mqtt_devices(Document):
    """Define device schema"""

    name = StringField(required=True, trim=True)
    uuid = StringField(required=True, unique=True, trim=True, min_length=36)
    token = StringField(required=True, trim=True)
    user_uuid = StringField(required=True, trim=True, min_length=36)
    client_uuid = StringField(required=True, trim=True, min_length=36)
    client_name = StringField(required=True, trim=True)
    number = IntField(required=True)
    io = StringField(required=True, choices=["input", "output"])
    signal = StringField(required=True, choices=["digital", "analog"])


class actions(Document):
    """Define action schema"""

    name = StringField(required=True, trim=True)
    uuid = StringField(required=True, unique=True, trim=True, min_length=36)
    user_uuid = StringField(required=True, trim=True, min_length=36)
    trigger_topic = StringField(required=True)
    trigger_state = IntField(required=True)
    responses = MapField(IntField(), required=True)
