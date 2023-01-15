from os import environ
from mongoengine import connect
from mongoengine.errors import ValidationError

from database_schemas import mqtt_clients, mqtt_servers
from logger import logger

host = environ.get(
    "MONGOURI",
    "",
)

connect(host=host)


class MQTTClient:
    """Operations for mqtt_clients collection"""

    @staticmethod
    def get_client_user(username: str) -> str:
        """Get ID of client's user"""
        return mqtt_clients.objects(username=username).first().user


class MQTTServer:
    """Operations for mqtt_servers collection"""

    @staticmethod
    def create_server(fields: dict = {}) -> bool:
        """Add document for new MQTT server to database"""
        # TODO verify and authenticate user
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

    @staticmethod
    def update_server(uid: str = None, fields: dict = None) -> bool:
        """Update document for MQTT server in database"""
        try:
            if fields is not None:
                for field, value in fields.items():
                    del fields[field]
                    fields["set__" + field] = value
                if mqtt_servers.objects(uid=uid).update_one(**fields) != 1:
                    logger.warning("Failed to update server in database")
                    return False
                logger.info("Server updated in database")
        except Exception as e:
            logger.warning("Failed to update server in database")
            logger.warning(e)
            return False
        return True

    @staticmethod
    def delete_server(uid: str = "") -> bool:
        """Delete document for MQTT server in database"""
        try:
            if len(uid) > 0:
                if mqtt_servers.objects(uid=uid).delete() != 1:
                    logger.warning("Failed to delete server in database")
                    return False
                logger.info("Server deleted in database")
        except Exception as e:
            logger.warning("Failed to delete server in database")
            logger.warning(e)
            return False
        return True
