from hashlib import sha256
from os import environ
from mongoengine import connect
from mongoengine.errors import ValidationError
from mongoengine.queryset.queryset import QuerySet

from database_schemas import (
    actions,
    mqtt_clients,
    mqtt_devices,
    mqtt_servers,
    mqtt_controllers,
)
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


class Action:
    """Operations for actions collection"""

    @staticmethod
    def get_actions(user: str = "") -> QuerySet:
        """Get all of user's actions"""
        return actions.objects(user=user)


class MQTTDevice:
    """Operations for mqtt_devices collection"""

    @staticmethod
    def get_devices(user: str = "") -> QuerySet:
        """Get all of user's devices"""
        return mqtt_devices.objects(user=user)


class MQTTServer:
    """Operations for mqtt_servers collection"""

    @staticmethod
    def create_server(fields: dict = {}) -> bool:
        """Add document for new MQTT server to database"""
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
    def server_exists(user: str) -> bool:
        """Check if MQTT server with user exists in database"""
        if len(mqtt_servers.objects(user=user)) > 0:
            return True
        return False

    @staticmethod
    def get_server(user: str = ""):  # TODO return type annotation
        """Get fields of user's MQTT server"""
        if not len(user) > 0:
            return None
        return mqtt_servers.objects(user=user).first()

    @staticmethod
    def update_server(user: str = "", fields: dict = {}) -> bool:
        """Update document for MQTT server in database"""
        try:
            if fields != {}:
                set_fields = {}
                for field, value in fields.items():
                    set_fields["set__" + field] = value
                if mqtt_servers.objects(user=user).update_one(**set_fields) != 1:
                    logger.warning("Failed to update server in database")
                    return False
                logger.info("Server updated in database")
        except Exception as e:
            logger.warning("Failed to update server in database")
            logger.warning(e)
            return False
        return True

    @staticmethod
    def delete_server(user: str = "") -> bool:
        """Delete document for MQTT server in database"""
        try:
            if len(user) > 0:
                if mqtt_servers.objects(user=user).delete() != 1:
                    logger.warning("Failed to delete server in database")
                    return False
                logger.info("Server deleted in database")
        except Exception as e:
            logger.warning("Failed to delete server in database")
            logger.warning(e)
            return False
        return True


class MQTTController:
    """Operations for mqtt_controllers collection"""

    @staticmethod
    def add_controller(username: str, password: str) -> bool:
        """Add document for new MQTT controller to database"""
        controller = mqtt_controllers(
            **{"username": username, "password": sha256(password.encode()).hexdigest()}
        )
        try:
            controller.validate()
            controller.save()
            logger.info("New controller added to database")
        except ValidationError as validation_error:
            logger.warning("Failed to validate new controller")
            logger.warning(validation_error)
            return False
        except Exception as e:
            logger.warning("Failed to add new controller to database")
            logger.warning(e)
            return False
        return True

    @staticmethod
    def delete_controller(username: str) -> bool:
        """Delete document for MQTT controller in database"""
        try:
            if mqtt_controllers.objects(username=username).delete() != 1:
                logger.warning("Failed to delete controller in database")
                return False
        except Exception as e:
            logger.warning("Failed to delete controller in database")
            logger.warning(e)
            return False
        logger.info("Controller deleted in database")
        return True
