"""Wrappers for various functions from the Kubernetes Python Client
Learn more at https://github.com/kubernetes-client/python"""

from kubernetes import client, config
from os import environ
from typing import Tuple
import yaml

kube_config_file = environ.get("KUBECONFIG", "kubeconfig.yaml")
config.load_kube_config(kube_config_file)  # Load kubeconfig file for client use
# Instantiate necessary Kubernetes APIs
k8s_core = client.CoreV1Api()
k8s_apps = client.AppsV1Api()


def get_pods(namespace: str = "default"):  # TODO return type annotation
    """Get all pods in namespace"""
    return k8s_core.list_namespaced_pod(namespace)


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
