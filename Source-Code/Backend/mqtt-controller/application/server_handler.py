"""Server Handler"""
from os import remove
from time import sleep, time

from database_handler import create_server, update_server, delete_server
from kubernetes_handler import (
    get_pods,
    get_pod,
    is_pod_ready,
    pod_command,
    check_namespaces,
    create_namespace,
    delete_namespace,
    create_deployment,
    delete_deployment,
)
from logger import logger
from mqtt_client import MQTTClient
from server_cache_handler import add_server_status, delete_server_status
from thread_handler import ThreadHandler

"""Password server message format"""
# Client format: 0x00 | 0X0A/0x0D | length | username | password
# Server format: 0xFF | 0x0A/0x0D | 0x00/0x01
# 0x00 : Client Header
# 0xFF : Server Header
# 0x0A/0x0D : Add/Delete password
# length : combined length of username and password, does not include length byte itself, single byte cannot store values > 255
# 0x00/0x01 : Success/Fail

# TODO get environment variables for constants
PASSWORD_SERVER_CERT_HOSTNAME = (
    "delta12"  # hostname used to generate SSL certificate for password server TLS
)
CONTAINER_CERT_PATH = "/cert.pem"
INACTIVITY_THRESHOLD = 120  # shutdown MQTT server if more than 2 minutes elapsed without multiple clients connected
CLIENTS_CONNECTED_TOPIC = "$SYS/broker/clients/connected"  # number of connected clients
MQTT_DEPLOYMENT = "mqtt-deployment.yaml"


class ServerHandler(ThreadHandler):
    """Represents MQTT server
    Start, stop, and check activity of MQTT server"""

    def __init__(
        self,
        user: str,
        inactivity_threshold: int = INACTIVITY_THRESHOLD,
    ):
        super().__init__(target=self.handler)
        self.server_info = {"user": user}
        self.deployment_name = ""
        self.cert = ""
        self.mqtt_client = MQTTClient()
        self.inactivity_threshold = inactivity_threshold
        self.client_count = 0
        self.last_client_count_update = time()
        self.start_server()

    def get_field(self, field: str):  # TODO return type annotation?
        """Get server field info"""
        return self.server_info.get(field)

    def update_field(self, field: str, value) -> None:
        """Update server field value, can only be called after entry created in database"""
        self.server_info[field] = value
        update_server(self.get_field("uuid"), self.server_info)

    def start_server(self) -> bool:
        """Start new MQTT server"""
        try:
            logger.info("Starting server...")
            add_server_status(self.get_field("user"), "STARTING")
            create_namespace(self.get_field("user"))
            # Wait for namespace to be created
            while not check_namespaces(self.get_field("user")):
                continue
            success, deployment_name = create_deployment(
                MQTT_DEPLOYMENT, namespace=self.get_field("user")
            )  # create Kubernetes deployment
            self.deployment_name = deployment_name
            if not success:
                logger.warning("Failed to start sever")
                return False
            # Wait for deployment to create pods
            while get_pods(namespace=self.get_field("user"), return_count=True)[1] == 0:
                continue
            # Get information from pod in deployment
            pods, pod_count = get_pods(
                namespace=self.get_field("user"), return_count=True
            )
            if pod_count > 1:  # each deployment should only have a single pod
                self.shutdown(handle_db=False)
                assert False
            for pod in pods.items:
                name = pod.metadata.name
                # Wait for pod to finish starting
                while not is_pod_ready(name, namespace=self.get_field("user")):
                    continue
                ready_pod = get_pod(name, namespace=self.get_field("user"))
                self.server_info["name"] = ready_pod.metadata.name
                self.server_info["uuid"] = ready_pod.metadata.uid
                self.server_info["addr"] = ready_pod.status.pod_ip
                self.server_info["port"] = 1883  # TODO dynamically set port?
                # Get SSL certificate from container and write to file
                self.cert = self.get_field("name") + "-cert.pem"
                cert = pod_command(
                    self.get_field("name"),
                    "cat " + CONTAINER_CERT_PATH,
                    namespace=self.get_field("user"),
                )
                cert_file = open(self.cert, "w")
                cert_file.write(cert)
                cert_file.close()
            if not create_server(self.server_info):  # Create database entry
                self.shutdown(handle_db=False)
                return False
            # Configure MQTT client
            self.mqtt_client.server = self.get_field("addr")
            self.mqtt_client.port = self.get_field("port")
            self.mqtt_client.cert_path = self.cert
            self.mqtt_client.cert_hostname = PASSWORD_SERVER_CERT_HOSTNAME
            self.mqtt_client.subscribe(CLIENTS_CONNECTED_TOPIC, int)
            if not self.mqtt_client.connect():  # connect client to monitor broker
                self.shutdown()
                return False
            logger.info("Starting server handler...")
            # TODO make sure mqtt_client is connected before starting control loop
            sleep(5)  # temporary fix to ensure mqtt_client is connected
            self.start()
        except:
            logger.warning("Failed to start sever")
            return False
        add_server_status(self.get_field("user"), "RUNNING")
        return True

    def shutdown(self, handle_db: bool = True) -> None:
        """Stutdown MQTT server"""
        logger.info("Stopping server...")
        add_server_status(self.get_field("user"), "SHUTDOWN")
        self.running = False
        delete_deployment(self.deployment_name, namespace=self.get_field("user"))
        delete_namespace(self.get_field("user"))
        remove(self.cert)  # delete SSL certificate copied from container
        if handle_db:
            delete_server(self.get_field("uuid"))
        delete_server_status(self.get_field("user"))

    def add_password(self, username: str, password: str):
        """Wrapper to add password to MQTT server"""
        return self.mqtt_client.handle_password(
            "add",
            username=username,
            password=password,
            server_addr=self.get_field("addr"),
            cert_path=self.cert,
            cert_hostname=PASSWORD_SERVER_CERT_HOSTNAME,
        )

    def delete_password(self, username: str):
        """Wrapper to delete password from MQTT server"""
        return self.mqtt_client.handle_password(
            "delete",
            username=username,
            server_addr=self.get_field("addr"),
            cert_path=self.cert,
            cert_hostname=PASSWORD_SERVER_CERT_HOSTNAME,
        )

    def update_client_count(self, count: int) -> None:
        """Update client count if it changes and update last count update time"""
        if count != self.client_count:
            self.client_count = count
            self.last_client_count_update = time()
            logger.info(f"Client count updated to {self.client_count}")

    def check_inactive(self) -> None:
        """Checks if client count has been 1 for at least the threshold duration
        and shuts down server if true"""
        now = time()
        if (
            # Client count should be at least 1 since Python client should always be connected
            self.client_count in (0, 1)
            and now - self.last_client_count_update >= self.inactivity_threshold
        ):
            self.shutdown()

    def handler(self) -> None:
        """Main control loop"""
        self.mqtt_client.client.loop()
        client_count = self.mqtt_client.topics.get(CLIENTS_CONNECTED_TOPIC)
        self.update_client_count(client_count)
        self.check_inactive()
