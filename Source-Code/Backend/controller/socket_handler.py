import socket
from queue import Queue
from struct import pack, unpack
from select import select
from time import time
from typing import Tuple

from constants import *
from logger import logger
from thread_handler import ThreadHandler

CLIENT_TIMEOUT = 15  # disconnect client after 15s inactivity


class ClientHandler(ThreadHandler):
    """Handle TCP client after initial connection is accepted,
    send and receive messages with client"""

    def __init__(
        self,
        socket: socket.socket = None,
        address: str = "",
        buffer_size: int = 4096,
        recv_queue: Queue = Queue(),
        send_queue: Queue = Queue(),
    ):
        super().__init__(target=self.poll_socket_and_send_data)
        self.socket = socket
        self.address = address
        self.selected_sockets = [self.socket] if self.socket is not None else []
        self.buffer_size = buffer_size
        self.recv_queue = recv_queue
        self.send_queue = send_queue
        self.timeout = time() + CLIENT_TIMEOUT
        self.requeue = True
        self.start()
        logger.info("ClientHandler started")

    def __del__(self):
        # TODO needs to be garbage collected after stop_and_close() is called
        print("ClientHandler __del__")
        self.stop_and_close(False)

    def stop_and_close(self, send_msg: bool = True) -> None:
        """Stop polling socket and close socket"""
        # only stop and close if currently running
        if self.running:
            self.stop()
            # send termination message
            if send_msg:
                self.socket.send(pack(HEADER_FORMAT, SERVER_HEADER, TERM, CRC))
            self.socket.close()
            self.requeue = False
            logger.info("ClientHandler stopped")

    def pack_and_send_data(self, format_str: str = "", data: Tuple = ()) -> None:
        """Pack data according to format str and put in send queue"""
        self.send_queue.put(pack(format_str, *data))

    def unpack_data(self, data: bytes) -> bool:
        """Unpack data from client and put on recv_queue"""
        # data == b"" indicates client closed connection
        if data == b"":
            self.stop_and_close()
            return True
        header, data_type, crc = unpack(
            HEADER_FORMAT, data[:HEADER_LENGTH].ljust(HEADER_LENGTH)
        )
        # TODO verify crc as well
        if header != CLIENT_HEADER:
            self.stop_and_close()
            return False
        if data_type in (INIT, CONF_ACK_SUCCESS, CONF_ACK_FAILED):
            client_uuid, client_key, client_addr = unpack(
                INIT_DATA_FORMAT, data[HEADER_LENGTH:].ljust(INIT_DATA_LENGTH)
            )
            client_uuid = client_uuid.decode()
            # TODO need encryption for device key
            client_key = client_key.decode()
            self.recv_queue.put(
                {
                    "data_type": data_type,
                    "client_uuid": client_uuid,
                    "client_key": client_key,
                    "client_addr": client_addr,
                }
            )
        # reset timeout
        self.timeout = time() + CLIENT_TIMEOUT
        return True

    def poll_socket_and_send_data(self) -> bool:
        """Poll socket for data to add to recv_queue and send any data in send_queue"""
        try:
            rlist, _, _ = select(self.selected_sockets, [], [], 0)
            for rsock in rlist:
                if rsock is self.socket:
                    data, _ = self.socket.recvfrom(self.buffer_size)
                    logger.info(data)
                    self.unpack_data(data)
        except Exception as error:
            logger.warning(error)
            return False
        try:
            while not self.send_queue.empty():
                self.socket.send(self.send_queue.get())
        except Exception as error:
            logger.warning(error)
            return False
        if time() >= self.timeout:
            self.stop_and_close()
        return True


class SocketHandler(ThreadHandler):
    """Open TCP socket and handle new client connections"""

    def __init__(
        self,
        address: tuple = ("0.0.0.0", 18080),
        buffer_size: int = 4096,
        client_handler_queue: Queue = Queue()
    ):
        super().__init__(target=self.accept_connections)
        self.socket = socket.socket(family=socket.AF_INET, type=socket.SOCK_STREAM)
        self.socket.bind(address)
        self.socket.listen()
        self.buffer_size = buffer_size
        self.client_handler_queue = client_handler_queue
        self.start()
        logger.info("SocketHandler started")

    def __del__(self):
        self.close_and_stop()

    def close_and_stop(self) -> None:
        """Stop accept_connections loop and close socket"""
        self.stop()
        self.socket.close()
        logger.info("SocketHandler stopped")

    def accept_connections(self) -> None:
        """Accept a new connection and instantiate a ClientHandler for new client"""
        logger.info("Listening for new connection...")
        client, addr = self.socket.accept()
        logger.info("New connection received from %s", addr)
        self.client_handler_queue.put(
            ClientHandler(
                socket=client,
                address=addr,
                buffer_size=self.buffer_size,
            )
        )
