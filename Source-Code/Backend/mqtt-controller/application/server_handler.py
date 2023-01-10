"""Server Handler"""
from os import environ

from database_handler import MQTTServer
from kubernetes_handler import Pod, Deployment
from logger import logger
from server_cache_handler import (
    States,
    add_server_status,
    delete_server_status,
    get_server_status,
)
from thread_handler import ThreadHandler

INACTIVITY_THRESHOLD = environ.get(
    "INACTIVITY_THRESHOLD", 120
)  # shutdown server if time elapsed without clients connected exceeds threshold
MQTT_DEPLOYMENT = environ.get("MQTT_DEPLOYMENT", "mqtt-deployment.yaml")


class ServerHandler(ThreadHandler):
    """Represents MQTT server
    Start, stop, and check activity of MQTT server"""

    def __init__(
        self,
        user: str,
        inactivity_threshold: int = INACTIVITY_THRESHOLD,
    ):
        super().__init__(target=self.start_server)
        self.server_info = {"user": user}
        self.user = user
        self.deployment_name = ""
        self.inactivity_threshold = inactivity_threshold
        self.start()

    def get_field(self, field: str):  # TODO return type annotation?
        """Get server field info"""
        return self.server_info.get(field)

    def update_field(self, field: str, value) -> bool:
        """Update server field value, can only be called after entry created in database"""
        self.server_info[field] = value
        return MQTTServer.update_server(self.get_field("uid"), self.server_info)

    def start_server(self) -> bool:
        """Start new MQTT server"""
        try:
            logger.info("Starting new server for user " + self.user)
            # Check if server for user alread exists in cache
            if get_server_status(self.user) != "":
                logger.info("Server already exists for user " + self.user)
                return False
            # Add server status in cache
            add_server_status(self.user, States.STARTING)
            # Create Kubernetes deployment
            success, deployment_name = Deployment.create_deployment(
                MQTT_DEPLOYMENT, namespace=self.user
            )
            if not success:
                logger.warning("Failed to start server for user " + self.user)
                return False
            self.deployment_name = deployment_name
            # Get information from pods in deployment
            pods = Pod.get_pods(namespace=self.user)
            # Create database entry for each pod in deployment
            for pod in pods.items:
                name = pod.metadata.name
                ready_pod = Pod.get_pod(name, namespace=self.user)
                self.server_info["name"] = ready_pod.metadata.name
                self.server_info["uid"] = ready_pod.metadata.uid
                self.server_info["addr"] = ready_pod.status.pod_ip
                self.server_info["port"] = 1883  # TODO dynamically set port?
                if not MQTTServer.create_server(self.server_info):
                    self.shutdown(
                        self.user,
                        self.deployment_name,
                        self.get_field("uid"),
                        handle_db=False,
                    )
                    return False
        except:
            logger.warning("Failed to start server for user " + self.user)
            return False
        add_server_status(self.user, States.RUNNING)
        logger.info("Successfully started server for user " + self.user)
        return True

    @staticmethod
    def shutdown(
        user: str, deployment_name: str, uid: str, handle_db: bool = True
    ) -> bool:
        """Shutdown MQTT server"""
        logger.info("Stopping server...")
        try:
            add_server_status(user, States.SHUTDOWN)
            Deployment.delete_deployment(deployment_name, namespace=user)
            Deployment.delete_namespace(user)
            if handle_db:
                MQTTServer.delete_server(uid)
            delete_server_status(user)
        except:
            logger.warning("Failed to stop server for user " + user)
            return False
        return True
