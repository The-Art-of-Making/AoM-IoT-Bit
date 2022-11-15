from collections import deque
from queue import Queue
from typing import Tuple
from signal import SIGTERM, signal, SIGINT
from sys import exit

from constants import *
from database_handler import get_client_server, get_server_config
from logger import logger
from socket_handler import ClientHandler, SocketHandler
from server_handler import ServerHandler
from thread_handler import ThreadHandler


class Controller(ThreadHandler):
    def __init__(self):
        super().__init__(target=self.controller)
        self.client_handler_queue = Queue()
        self.socket_handler = SocketHandler(
            client_handler_queue=self.client_handler_queue
        )
        self.servers = {}
        self.start()
        logger.info("Controller started")

    def __del__(self):
        # terminate connection with any remaining clients
        while not self.client_handler_queue.empty():
            client_handler = self.client_handler_queue.get()
            client_handler.stop_and_close(False)
        # shutdown and delete servers
        for _, server in self.servers.items():
            server.shutdown()
        self.servers.clear()
        logger.info("Controller stopped")

    def start_server(self, user: str) -> str:
        """Start a new server and add to servers dictionary"""
        server = ServerHandler(user)
        uuid = server.uuid
        self.servers[uuid] = server
        return uuid

    def handle_client_connect(
        self, client_uuid: str, client_key: str
    ) -> Tuple[str, int, int]:
        """Start server if not already running and return information to connect"""
        # query db to verify device and get server associated with device account
        user, server_uuid = get_client_server(client_uuid, client_key)
        if user is not None:
            # check if server associated with device is running
            if not server_uuid in self.servers:
                # start server if not
                server_uuid = self.start_server(user)
        # return config info
        return server_uuid, *get_server_config(server_uuid)

    def handle_client_data(self, client_handler: ClientHandler) -> str:
        logger.info("handling client data...")
        if not client_handler.recv_queue.empty():
            data = client_handler.recv_queue.get()
            data_type = data.get("data_type")
            if data_type in (INIT, CONF_ACK_FAILED):
                # get connection info from database
                server_uuid, server_addr, server_port = self.handle_client_connect(
                    data.get("client_uuid"), data.get("client_key")
                )
                if server_addr is None or server_port is None:
                    client_handler.stop_and_close()
                else:
                    # send connection from database to client
                    client_handler.pack_and_send_data(
                        CONF_SEND_FORMAT,
                        (SERVER_HEADER, CONF_SEND, CRC, server_addr, server_port),
                    )
                return server_uuid
            if data_type == CONF_ACK_SUCCESS:
                client_handler.stop_and_close()
        if client_handler.requeue:
            self.client_handler_queue.put(client_handler)
        return ""

    def controller(self) -> None:
        """Main control loop to handle client data and remove terminated servers"""
        # logger.info("handling clients")
        # handle client data
        # requeue_deque = deque()
        while not self.client_handler_queue.empty():
            client_handler = self.client_handler_queue.get()
            self.handle_client_data(client_handler)
        # remove stopped servers
        remove_servers = deque()
        for server_uuid, server in self.servers.items():
            if not server.is_running():
                remove_servers.append(server_uuid)
        while len(remove_servers) > 0:
            server_uuid = remove_servers.popleft()
            del self.servers[server_uuid]


def handler(signal_received, frame):
    logger.info(f"Recd {signal_received} from {frame}")
    logger.info("SIGTERM or SIGINT or CTRL-C detected. Exiting gracefully")
    exit(0)


signal(SIGINT, handler)
signal(SIGTERM, handler)


if __name__ == "__main__":
    controller = Controller()
    while True:
        continue
