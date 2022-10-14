from queue import Queue
from struct import unpack
from typing import Tuple

from database_handler import get_client_server, get_server_config
from socket_handler import ClientHandler, SocketHandler
from server_handler import ServerHandler

# client connection
# 0x00, 0xAA, type, crc (2 bytes), client uuid, device key, ip

# server
# 0x00, 0xFF, type

# headers
CLIENT_HEADER = 0x00AA
SERVER_HEADER = 0x00FF

# data types
INIT = 0x00
CONF_ACK_SUCCESS = 0x01
CONF_ACK_FAILED = 0x02
TERM = 0x03


class Controller:
    def __init__(self):
        self.client_handler_queue = Queue()
        self.server_removal_queue = Queue()
        self.socket_handler = SocketHandler(self.client_handler_queue)
        self.servers = {}

    def start_server(self, user: str) -> str:
        """Start new server and add to servers dictionary"""
        server = ServerHandler(user, self.server_removal_queue)
        uuid = server.uuid
        self.servers[uuid] = server
        return uuid

    def remove_server(self, uuid: str = None) -> None:
        """Remove server from servers dictionary"""
        if uuid in self.servers:
            del self.servers[uuid]

    def handle_client_connect(
        self, client_uuid: str, client_key: str
    ) -> Tuple[str, int]:
        """Start server if not already running and return information to connect"""
        # query db to verify device and get server associated with device account
        user, server_uuid = get_client_server(client_uuid, client_key)
        if user is not None:
            # check if server associated with device is running
            if not server_uuid in self.servers:
                # start server if not
                server_uuid = self.start_server(user)
        # return config info
        return get_server_config(server_uuid)

    # TODO re-write to handle client data from controller instead of socket handler
    def handle_client_data(
        self, client_handler: ClientHandler
    ) -> Tuple[bool, int, str, str]:
        data = client_handler.recv_queue.get()
        # TODO validate data length with .ljust(81)?
        header, data_type, crc, client_uuid, client_key, ip_addr = unpack(
            "=2HB36s36s4I", data
        )
        client_uuid = client_uuid.decode()
        # TODO need encryption for device key
        device_key = device_key.decode()
        return_data = (False, data_type, client_uuid, client_key)
        if header != CLIENT_HEADER:  # TODO verify crc as well
            client_handler.stop_and_close()
            return return_data
        if data_type in (INIT, CONF_ACK_SUCCESS, CONF_ACK_FAILED):
            return_data = (True, data_type, client_uuid, client_key)
        return return_data
