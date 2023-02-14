"""Wrappers for various functions from the Kubernetes Python Client
Learn more at https://github.com/kubernetes-client/python"""

from kubernetes import client, config
from kubernetes.stream import stream
from os import environ
from time import sleep
from typing import Tuple
from yaml import safe_load

CHECK_TIMEOUT = 0.5  # time to sleep while repeatedly checking for pod, namespace, etc.
KUBE_CONFIG_FILE = environ.get("KUBECONFIG", "kubeconfig.yaml")
DEVELOPMENT = environ.get("DEVELOPMENT", "False")  # environ.get returns string
if DEVELOPMENT == "True":
    config.load_kube_config(KUBE_CONFIG_FILE)  # Load kubeconfig file for client use
else:
    config.load_incluster_config()  # load config inside cluster
# Instantiate necessary Kubernetes APIs
k8s_core = client.CoreV1Api()
k8s_apps = client.AppsV1Api()


class Pod:
    """Operations for Pods"""

    # TODO return type annotation
    @staticmethod
    def get_pods(namespace: str = "default", return_count: bool = False):
        """Get all pods in namespace, also return number of pods in namespace if return_count is true"""
        pods = k8s_core.list_namespaced_pod(namespace)
        if return_count:
            count = 0
            for _ in pods.items:
                count += 1
            return pods, count
        return pods

    # TODO return type annotation
    @staticmethod
    def get_pod(name: str, namespace: str = "default"):
        """Get pod by name in namespace"""
        return k8s_core.read_namespaced_pod(name, namespace)

    @staticmethod
    def get_pod_names(namespace: str = "default") -> list:
        """Get list of pod names in namespace"""
        names = []
        pod_list = Pod.get_pods(namespace)
        for pod in pod_list.items:
            names.append(pod.metadata.name)
        return names

    @staticmethod
    def get_pod_ips(namespace: str = "default") -> dict:
        """Get list of IPs by pod name"""
        ips = {}
        pod_list = Pod.get_pods(namespace)
        for pod in pod_list.items:
            ips[pod.metadata.name] = pod.status.pod_ip
        return ips

    @staticmethod
    def is_pod_ready(name: str, namespace: str = "default") -> bool:
        """Returns true if pod has name, uid, and ip"""
        pod = Pod.get_pod(name, namespace=namespace)
        if None in (
            pod.metadata.name,
            pod.metadata.uid,
            pod.status.pod_ip,
        ):
            return False
        return True

    # TODO type annotation
    @staticmethod
    def pod_command(
        name: str,
        command: str,
        namespace: str = "default",
        stderr=True,
        stdin=True,
        stdout=True,
        tty=True,
    ):
        """Execute command in pod and return result"""
        return stream(
            k8s_core.connect_get_namespaced_pod_exec,
            name,
            namespace,
            command=["/bin/sh", "-c", command],
            stderr=stderr,
            stdin=stdin,
            stdout=stdout,
            tty=tty,
        )


class Namespace:
    """Operations for Namespaces"""

    @staticmethod
    def check_namespaces(name: str) -> bool:
        """Check if namespace with name exists"""
        namespaces = k8s_core.list_namespace()
        for namespace in namespaces.items:
            if namespace.metadata.name == name:
                return True
        return False

    @staticmethod
    def create_namespace(name: str) -> bool:
        """Create namespace with name"""
        try:
            namespace = {
                "apiVersion": "v1",
                "kind": "Namespace",
                "metadata": {"name": name, "labels": {"name": name}},
            }
            k8s_core.create_namespace(namespace)
            # Wait for namespace to be created
            while not Namespace.check_namespaces(name):
                sleep(CHECK_TIMEOUT)
            return True
        except:
            return False

    @staticmethod
    def delete_namespace(name: str) -> bool:
        """Delete namespace with name"""
        try:
            k8s_core.delete_namespace(name)
            return True
        except:
            return False


class Deployment:
    """Operations for Deployments"""

    @staticmethod
    def check_deployments(name: str, namespace: str = "default") -> bool:
        """Check if deployment with name exists in namespace"""
        if not Namespace.check_namespaces(namespace):
            return False
        deployments = k8s_apps.list_namespaced_deployment(namespace)
        for deployment in deployments.items:
            if deployment.metadata.name == name:
                return True
        return False

    @staticmethod
    def create_deployment(
        deployment_file_path: str, name: str = "", namespace: str = "default"
    ) -> Tuple[bool, str]:
        """Create deployment in namespace from yaml file"""
        try:
            # Load deployment from file
            deployment_file = open(deployment_file_path, "r", encoding="UTF-8")
            deployment = safe_load(deployment_file)
            deployment_file.close()
            # Set name if specified
            if name != "":
                deployment["metadata"]["name"] = name
            # Create namespace if it does not already exist
            if not Namespace.check_namespaces(namespace):
                Namespace.create_namespace(namespace)
            # Create deployment in namespace
            response = k8s_apps.create_namespaced_deployment(
                body=deployment, namespace=namespace
            )
            # Wait for pod(s) to finish starting
            finished = False
            while not finished:
                pods = Pod.get_pods(namespace=namespace)
                finished = True
                for pod in pods.items:
                    if not Pod.is_pod_ready(pod.metadata.name, namespace=namespace):
                        finished = False
                sleep(CHECK_TIMEOUT)
            return True, response.metadata.name  # return deployment name
        except:
            return False, ""

    @staticmethod
    def delete_deployment(deployment_name: str, namespace: str = "default") -> bool:
        """Delete deployment by name in namespace"""
        try:
            k8s_apps.delete_namespaced_deployment(deployment_name, namespace)
            return True
        except:
            return False
