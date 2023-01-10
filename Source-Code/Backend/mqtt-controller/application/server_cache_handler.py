"""Wrapper for Redis client to access Redis cache storing server states"""

import os
import redis

redis_client = redis.Redis(
    host=os.environ.get("REDIS_ADDR", "localhost"),
    port=os.environ.get("REDIS_PORT", "6379"),
)


class States:
    """Server states"""

    WAITING = "WAITING"
    STARTING = "STARTING"
    RUNNING = "RUNNING"
    SHUTDOWN = "SHUTDOWN"
    ERROR = "ERROR"

    STATES = {WAITING, STARTING, RUNNING, SHUTDOWN, ERROR}


def add_server_status(user: str, server_status: str) -> bool:
    """Add user, server_status key-value pair to redis server cache to keep track of user server states"""
    if server_status in States.STATES:
        return redis_client.set(str(user), str(server_status))
    return False


def delete_server_status(user: str) -> bool:
    """Delete user, server key-value pair from redis server cache"""
    response = redis_client.delete(str(user))
    if response > 0:
        return True
    return False


def get_server_status(user: str) -> str:
    """Get server status for user"""
    response = redis_client.get(str(user))
    if response is None:
        return ""
    return response.decode()
