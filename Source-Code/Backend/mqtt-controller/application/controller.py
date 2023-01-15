from queue import Queue
from time import sleep
from typing import Tuple

from database_handler import MQTTClient
from logger import logger
from server_cache_handler import States, add_server_status, get_server_status
from server_handler import ServerHandler
from thread_handler import ThreadHandler


class Controller(ThreadHandler):
    def __init__(self):
        super().__init__(target=self.controller)
        self.new_user_servers = Queue()  # stores users needing new servers
        self.servers = {}
        self.start()
        logger.info("Controller started")

    def stop_controller(self) -> None:
        """Stop thread, shutdown and delete servers"""
        self.stop()
        for _, server in self.servers.items():
            server.shutdown(
                server.user, server.deployment_name, server.get_field("uid")
            )
        self.servers.clear()
        logger.info("Controller stopped")

    def start_server(self, user: str) -> None:
        """Start a new server and add to servers dictionary"""
        server = ServerHandler(user)
        self.servers[user] = server

    def handle_client_connect(
        self, client_username: str, client_password: str
    ) -> Tuple[bool, str]:
        """Start MQTT servers and return server status"""
        user = MQTTClient.get_client_user(client_username)
        if user is None:
            return False, "Failed to authenticate"
        # Check if server for user alread exists in cache
        status = get_server_status(user)
        # Start server if user does not already have one running
        if status == "":
            self.new_user_servers.put(user)
            add_server_status(user, States.WAITING)
            return True, get_server_status(user)
        # Return server status
        if status in States.STATES:
            return True, status
        return False, "Encountered unknown error"

    def controller(self) -> None:
        """Main control loop to start servers and remove terminated servers"""
        # Start new user servers
        while not self.new_user_servers.empty():
            user = self.new_user_servers.get()
            self.start_server(user)
        sleep(0.5)


if __name__ == "__main__":
    controller = Controller()
    while True:
        continue
