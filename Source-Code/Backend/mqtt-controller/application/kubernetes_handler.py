"""Wrappers for various functions from the Kubernetes Python Client
Learn more at https://github.com/kubernetes-client/python"""

from kubernetes import client, config
from kubernetes.stream import stream
from os import environ
from typing import Tuple
import yaml

kube_config_file = environ.get("KUBECONFIG", "kubeconfig.yaml")
config.load_kube_config(kube_config_file)  # Load kubeconfig file for client use
# Instantiate necessary Kubernetes APIs
k8s_core = client.CoreV1Api()
k8s_apps = client.AppsV1Api()


def get_pods(
    namespace: str = "default", return_count: bool = False
):  # TODO return type annotation
    """Get all pods in namespace, also return number of pods in namespace if return_count is true"""
    pods = k8s_core.list_namespaced_pod(namespace)
    if return_count:
        count = 0
        for _ in pods.items:
            count += 1
        return pods, count
    return pods


def get_pod(name: str, namespace: str = "default"):  # TODO return type annotation
    """Get pod by name in namespace"""
    return k8s_core.read_namespaced_pod(name, namespace)


def get_pod_names(namespace: str = "default") -> list:
    """Get list of pod names in namespace"""
    names = []
    pod_list = get_pods(namespace)
    for pod in pod_list.items:
        names.append(pod.metadata.name)


def get_pod_ips(namespace: str = "default") -> dict:
    """Get list of IPs by pod name"""
    ips = {}
    pod_list = get_pods(namespace)
    for pod in pod_list.items:
        ips[pod.metadata.name] = pod.status.pod_ip
    return ips


def is_pod_ready(name: str, namespace: str = "default") -> bool:
    """Returns true if pod has name, uid, and ip"""
    pod = get_pod(name, namespace=namespace)
    if None in (
        pod.metadata.name,
        pod.metadata.uid,
        pod.status.pod_ip,
    ):
        return False
    return True


def pod_command(
    name: str,
    command: str,
    namespace: str = "default",
    stderr=True,
    stdin=True,
    stdout=True,
    tty=True,
):  # TODO type annotation
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


def check_namespaces(name: str) -> bool:
    """Check if namespace with name exists"""
    namespaces = k8s_core.list_namespace()
    for namespace in namespaces.items:
        if namespace.metadata.name == name:
            return True
    return False


def create_namespace(name: str) -> bool:
    """Create namespace with name"""
    try:
        namespace = {
            "apiVersion": "v1",
            "kind": "Namespace",
            "metadata": {"name": name, "labels": {"name": name}},
        }
        k8s_core.create_namespace(namespace)
        return True
    except:
        return False


def delete_namespace(name: str) -> bool:
    """Delete namespace with name"""
    try:
        k8s_core.delete_namespace(name)
        return True
    except:
        return False


def create_deployment(
    deployment_file_path: str, name: str = "", namespace: str = "default"
) -> Tuple[bool, str]:
    """Create deployment in namespace from yaml file"""
    try:
        deployment_file = open(deployment_file_path, "r", encoding="UTF-8")
        deployment = yaml.safe_load(deployment_file)
        if name != "":
            deployment["metadata"]["name"] = name
        response = k8s_apps.create_namespaced_deployment(
            body=deployment, namespace=namespace
        )
        deployment_file.close()
        return True, response.metadata.name  # return deployment name
    except:
        return False, ""


def delete_deployment(deployment_name: str, namespace: str = "default") -> bool:
    """Delete deployment by name in namespace"""
    try:
        k8s_apps.delete_namespaced_deployment(deployment_name, namespace)
        return True
    except:
        return False
