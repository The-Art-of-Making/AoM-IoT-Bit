from collections import deque
from queue import Queue
from secrets import token_hex
from typing import Tuple

from database_handler import get_client_server
from logger import logger
from server_handler import ServerHandler
from thread_handler import ThreadHandler


class Controller(ThreadHandler):
    def __init__(self):
        super().__init__(target=self.controller)
        self.new_user_servers = Queue()  # stores users needing new servers
        self.servers = {}
        self.start()
        logger.info("Controller started")

    def __del__(self):
        """Shutdown and delete servers"""
        for _, server in self.servers.items():
            server.shutdown()
        self.servers.clear()
        logger.info("Controller stopped")

    def start_server(self, user: str) -> str:
        """Start a new server and add to servers dictionary"""
        server = ServerHandler(user)
        uuid = server.get_field("uuid")
        self.servers[uuid] = server
        return uuid

    def handle_client_connect(
        self, client_uuid: str, client_key: str
    ) -> Tuple[bool, str]:
        """Generate and return client password for connecting to MQTT server"""
        user, server_uuid = get_client_server(
            client_uuid, client_key
        )  # query db to verify device and get server associated with device account
        if user is None:
            return False, "Failed to authenticate"
        # check if server associated with device is running
        if server_uuid in self.servers:
            password = token_hex()  # generate new password
            self.servers[server_uuid].delete_password(
                client_uuid
            )  # delete possible previous password
            self.servers[server_uuid].add_password(
                client_uuid, password
            )  # add new password
            return True, password
        else:
            self.new_user_servers.put(user)
            return True, "Server is starting"

    def controller(self) -> None:
        """Main control loop to start servers and remove terminated servers"""
        # Start new user servers
        while not self.new_user_servers.empty():
            self.start_server(self.new_user_servers.get())
        # Remove stopped servers
        remove_servers = deque()
        for server_uuid, server in self.servers.items():
            if not server.is_running():
                remove_servers.append(server_uuid)
        while len(remove_servers) > 0:
            server_uuid = remove_servers.popleft()
            del self.servers[server_uuid]


if __name__ == "__main__":
    controller = Controller()
    while True:
        continue
