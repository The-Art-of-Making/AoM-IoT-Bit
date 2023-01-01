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
        self.users = (
            set()
        )  # set to store users with servers, check to prevent duplicates
        self.servers = {}  # TODO self.servers and self.users need to be thread safe
        self.start()
        logger.info("Controller started")

    def stop_controller(self) -> None:
        """Stop thread, shutdown and delete servers"""
        self.stop()
        for _, server in self.servers.items():
            server.shutdown()
        self.servers.clear()
        logger.info("Controller stopped")

    def start_server(self, user: str) -> None:
        """Start a new server and add to servers dictionary"""
        # TODO replace user with user uuid
        server = ServerHandler(user)
        uuid = server.get_field("uuid")
        self.servers[uuid] = server

    def handle_client_connect(
        self, client_uuid: str, client_key: str
    ) -> Tuple[bool, str]:
        """Generate and return client password for connecting to MQTT server"""
        user, server_uuid = get_client_server(
            client_uuid, client_key
        )  # query db to verify device and get server associated with device account
        if user is None:
            return False, "Failed to authenticate"
        # TODO check database for other servers for same user started by other controllers
        # check if server associated with device is running
        if server_uuid in self.servers:
            password = token_hex()  # generate new password
            self.servers[server_uuid].delete_password(
                client_uuid
            )  # delete possible previous password
            self.servers[server_uuid].add_password(
                client_uuid, password
            )  # add new password
            if user in self.users:
                self.users.remove(user)
            return True, password
        else:
            # Check that client with same user has not already made request to start server
            if user not in self.users:
                self.new_user_servers.put(user)
                self.users.add(user)
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
            user = self.servers[server_uuid].get_field("user")
            del self.servers[server_uuid]
            if user in self.users:
                self.users.remove(user)


if __name__ == "__main__":
    controller = Controller()
    while True:
        continue
