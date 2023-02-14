"""Server Handler"""
from os import environ
from threading import Thread
from time import sleep, time
from typing import Callable, Tuple

from database_handler import MQTTServer
from database_schemas import ServerStates
from kubernetes_handler import Pod, Deployment, Namespace
from logger import logger

INACTIVITY_THRESHOLD = environ.get(
    "INACTIVITY_THRESHOLD", 120
)  # shutdown server if time elapsed without clients connected exceeds threshold
MQTT_DEPLOYMENT = environ.get("MQTT_DEPLOYMENT", "mqtt-deployment.yaml")


def start_server_target(
    user: str,
    callback: Callable = None,
    callback_args: tuple = (),
    callback_kwargs: dict = {},
) -> bool:
    """Target for thread starting new MQTT server"""
    server_info = {"user": user}
    try:
        logger.info("Starting server for user " + user)
        # Check if server is already running
        if MQTTServer.get_server(user=user).status != ServerStates.SHUTDOWN:
            logger.info("Server already running for user " + user)
            return False
        # Update server status
        MQTTServer.update_server(user=user, fields={"status": ServerStates.STARTING})
        # Create Kubernetes deployment
        success, deployment_name = Deployment.create_deployment(
            MQTT_DEPLOYMENT, namespace=user
        )
        if not success:
            logger.warning("Failed to start server for user " + user)
            MQTTServer.update_server(
                user=user, fields={"status": ServerStates.SHUTDOWN}
            )
            return False
        deployment_name = deployment_name
        # Get information from pods in deployment
        pods = Pod.get_pods(namespace=user)
        # Create database entry for each pod in deployment
        for pod in pods.items:
            name = pod.metadata.name
            ready_pod = Pod.get_pod(name, namespace=user)
            # Ensure pod has IP addr
            while ready_pod.status.pod_ip is None:
                sleep(0.1)
                ready_pod = Pod.get_pod(name, namespace=user)
            ready_pod = Pod.get_pod(name, namespace=user)
            server_info["name"] = ready_pod.metadata.name
            server_info["uid"] = ready_pod.metadata.uid
            server_info["addr"] = ready_pod.status.pod_ip
            server_info["port"] = 1883  # TODO dynamically set port?
            if not MQTTServer.update_server(server_info):
                shutdown_server(user)
                return False
    except:
        logger.warning("Failed to start server for user " + user)
        MQTTServer.update_server(user=user, fields={"status": ServerStates.SHUTDOWN})
        return False
    MQTTServer.update_server(user=user, fields={"status": ServerStates.RUNNING})
    logger.info("Successfully started server for user " + user)
    try:
        if callback is not None:
            callback(*callback_args, **callback_kwargs)
    except:
        logger.warning("Start server callback failed")
    return True


def start_server(
    user: str,
    callback: Callable = None,
    callback_args: tuple = (),
    callback_kwargs: dict = {},
) -> None:
    """Start new thread to start MQTT server"""
    start_server_thread = Thread(
        target=start_server_target,
        args=(user, callback, callback_args, callback_kwargs),
    )
    start_server_thread.daemon = True
    start_server_thread.start()


def shutdown_server(user: str, callback: Callable = None) -> bool:
    """Shutdown MQTT server"""
    logger.info("Stopping server for user " + user)
    try:
        MQTTServer.update_server(
            user=user, fields={"status": ServerStates.SHUTTING_DOWN}
        )
        deployment_name = MQTTServer.get_server(user=user).name
        Deployment.delete_deployment(deployment_name, namespace=user)
        Namespace.delete_namespace(user)
        MQTTServer.update_server(user=user, fields={"status": ServerStates.SHUTDOWN})
    except:
        logger.warning("Failed to stop server for user " + user)
        return False
    logger.info("Successfully stopped server for user " + user)
    try:
        if callback is not None:
            callback()
    except:
        logger.warning("Shutdown server callback failed")
    return True


def check_server(
    name: str,
    user: str,
    uid: str,
    timestamp: float,
    client_count: int,
    client_count_timestamp: float,
) -> Tuple[float, int, float]:
    """Perform check on MQTT server"""
    # TODO pass message timestamp and perform async wait
    logger.info("Checking server " + name + " with UID " + uid + " for user " + user)
    pod_exists = True
    try:
        mqtt_pod = Pod.get_pod(name, namespace=user)
    except:
        logger.info("Failed to get pod for server with user " + user)
        return None, None, None
    if not pod_exists:
        logger.info("Check for nonexistent server")
        shutdown_server(user)
        return None, None, None
    if not MQTTServer.server_exists(user=user):
        logger.info("MQTT server " + uid + " without database entry")
        fields = {
            "user": user,
            "name": mqtt_pod.metadata.name,
            "status": ServerStates.RUNNING,
            "uid": mqtt_pod.metadata.uid,
            "addr": mqtt_pod.status.pod_ip,
            "port": 1883,  # TODO dynamically set port?
        }
        if not MQTTServer.create_server(fields):
            logger.info(
                "Failed to create database entry created for MQTT server " + uid
            )
        else:
            logger.info("Database entry created for MQTT server " + uid)
    # TODO check client count
    return time(), client_count, client_count_timestamp
