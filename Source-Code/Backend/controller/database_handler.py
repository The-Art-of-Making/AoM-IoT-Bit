from typing import Tuple

from mongoengine import connect, Document
from mongoengine.errors import ValidationError
from mongoengine.fields import DateTimeField, IntField, StringField

from logger import logger

connect(host="")


class users(Document):
    """Define user schema"""

    username = StringField(required=True, unique=True, trim=True)
    email = StringField(required=True)
    password = StringField(required=True, min_length=8)
    date = DateTimeField()


class devices(Document):
    """Define device schema"""

    uuid = StringField(required=True, unique=True, trim=True)
    client = StringField(required=True, trim=True)
    device_type = StringField(required=True, trim=True)
    port = IntField(required=True)


class mqtt_clients(Document):
    """Define client schema"""

    user = StringField(required=True, trim=True)
    uuid = StringField(required=True, unique=True, trim=True)
    key = StringField(required=True, unique=True, trim=True)
    ip_addr = StringField(trim=True)


class mqtt_servers(Document):
    """Define server schema"""

    user = StringField(required=True, unique=True, trim=True)
    uuid = StringField(required=True, unique=True, trim=True)
    addr = StringField(required=True, trim=True)
    port = IntField(required=True)
    client_count = IntField(required=True)


def create_server(fields: dict = {}) -> bool:
    """Add document for new MQTT server to database"""
    # TODO verify and authenticate user
    fields["client_count"] = 0
    server = mqtt_servers(**fields)
    try:
        server.validate()
        server.save()
        logger.info("New server added to database")
    except ValidationError as validation_error:
        logger.warning("Failed to validate new server")
        logger.warning(validation_error)
        return False
    except Exception as e:
        logger.warning("Failed to add new server to database")
        logger.warning(e)
        return False
    return True


def update_server(uuid: str = None, fields: dict = None) -> bool:
    """Update document for MQTT server in database"""
    try:
        if fields is not None:
            for field, value in fields.items():
                del fields[field]
                fields["set__" + field] = value
            if mqtt_servers.objects(uuid=uuid).update_one(**fields) != 1:
                logger.warning("Failed to update server in database")
                return False
            logger.info("Server updated in database")
    except Exception as e:
        logger.warning("Failed to update server in database")
        logger.warning(e)
        return False
    return True


def delete_server(uuid: str = None) -> bool:
    """Update document for MQTT server in database"""
    try:
        if uuid is not None:
            if mqtt_servers.objects(uuid=uuid).delete() != 1:
                logger.warning("Failed to delete server in database")
                return False
            logger.info("Server deleted in database")
    except Exception as e:
        logger.warning("Failed to delete server in database")
        logger.warning(e)
        return False
    return True


def authenticate_client(uuid: str, key: str) -> bool:
    """Check if client exists in database and if keys match"""
    # TODO add hashing for key
    client = mqtt_clients.objects(uuid=uuid).first()
    if client is not None:
        return key == client.key
    return False


def get_client_server(uuid: str, key: str) -> Tuple[str, str]:
    """Get UUID of client's user's MQTT server"""
    user = None
    server_uuid = None
    if authenticate_client(uuid, key):
        user = mqtt_clients.objects(uuid=uuid).first().user
        server = mqtt_servers.objects(user=user).first()
        if server is not None:
            server_uuid = server.uuid
    return user, server_uuid


def get_server_config(uuid: str) -> Tuple[str, int]:
    """Get MQTT server address and port"""
    server = mqtt_servers.objects(uuid=uuid).first()
    if server is not None:
        return (server.addr, server.port)
    return (None, None)


def update_client(uuid: str, key: str, fields: dict = None) -> bool:
    """Update document for MQTT client in database"""
    try:
        if not authenticate_client(uuid, key):
            logger.warning("Failed to authenticate client")
            return False
        if fields is not None:
            for field, value in fields.items():
                del fields[field]
                fields["set__" + field] = value
            if mqtt_clients.objects(uuid=uuid).update_one(**fields) != 1:
                logger.warning("Failed to update client in database")
                return False
            logger.info("Client updated in database")
    except Exception as e:
        logger.warning("Failed to update client in database")
        logger.warning(e)
        return False
    return True
