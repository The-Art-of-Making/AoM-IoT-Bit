"""Operations relating to MonogDB database for AoM IoT Bit"""

from os import environ
from bcrypt import checkpw, gensalt, hashpw
from mongoengine import connect
from mongoengine.errors import ValidationError
from mongoengine.queryset.queryset import QuerySet

from database_schemas import mqtt_services, mqtt_clients, mqtt_devices, actions
from logger import logger

host = environ.get("MONGOURI", "")

connect(host=host)


class DatabaseHandler_MqttServices:
    """Operations for mqtt_services collection"""

    @staticmethod
    def add_service(uuid: str, token: str) -> bool:
        """Add a document for new MQTT service to the database"""
        service = mqtt_services(
            **{"uuid": uuid, "token": hashpw(token.encode(), gensalt(10))}
        )
        try:
            service.validate()
            service.save()
            logger.info("New MQTT service added to database")
        except ValidationError as validation_error:
            logger.warning("Failed to validate new MQTT service")
            logger.warning(validation_error)
            return False
        except Exception as exception:
            logger.warning("Failed to add new MQTT service to database")
            logger.warning(exception)
            return False
        return True

    @staticmethod
    def delete_service(uuid: str) -> bool:
        """Delete the document for MQTT service in the database"""
        try:
            if mqtt_services.objects(uuid=uuid).delete() != 1:
                logger.warning("Failed to delete MQTT service in database")
                return False
        except Exception as exception:
            logger.warning("Failed to delete MQTT service in database")
            logger.warning(exception)
            return False
        logger.info("MQTT service deleted in database")
        return True


class DatabaseHandler_MqttClients:
    """Operations for mqtt_clients collection"""

    @staticmethod
    def client_auth(uuid: str, token: str) -> bool:
        """Authenticate an MQTT client"""
        mqtt_client = mqtt_clients.objects(uuid=uuid).first()
        if mqtt_client is not None:
            return checkpw(token.encode(), mqtt_client.token)
        return False

    @staticmethod
    def get_client(uuid: str):  # TODO type annotation
        """Get MQTT client"""
        return mqtt_clients.objects(uuid=uuid).first()

    @staticmethod
    def get_client_user(uuid: str) -> str:
        """Get the UUID of the MQTT client's user"""
        return mqtt_clients.objects(uuid=uuid).first().user_uuid


class DatabaseHandler_MqttDevices:
    """Operations for mqtt_devices collection"""

    @staticmethod
    def get_user_devices(user_uuid: str) -> QuerySet:
        """Get all of a user's devices"""
        return mqtt_devices.objects(user_uuid=user_uuid)

    @staticmethod
    def get_client_devices(client_uuid: str) -> QuerySet:
        """Get all of a client's devices"""
        return mqtt_devices.objects(client_uuid=client_uuid)


class DatabaseHandler_Actions:
    """Operations for actions collection"""

    @staticmethod
    def get_actions(user_uuid: str = "") -> QuerySet:
        """Get all of a user's actions"""
        return actions.objects(user_uuid=user_uuid)
