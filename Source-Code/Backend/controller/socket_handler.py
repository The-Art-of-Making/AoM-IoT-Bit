import socket
from queue import Queue
from select import select

from logger import logger
from thread_handler import ThreadHandler


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
        self.start()
        logger.info("ClientHandler started")

    def __del__(self):
        self.stop_and_close()

    def stop_and_close(self) -> None:
        """Stop polling socket and close socket"""
        self.stop()
        self.socket.close()
        logger.info("ClientHandler stopped")

    def poll_socket_and_send_data(self) -> bool:
        try:
            rlist, _, _ = select(self.selected_sockets, [], [], 0)
            for rsock in rlist:
                if rsock is self.socket:
                    data, _ = self.socket.recvfrom(self.buffer_size)
                    logger.info(data)
                    if data == b"":
                        self.stop_and_close()
                    else:
                        self.recv_queue.put(data)
        except Exception as error:
            logger.warning(error)
            return False
        try:
            while not self.send_queue.empty():
                self.socket.send(self.send_queue.get())
        except Exception as error:
            logger.warning(error)
            return False
        return True


class SocketHandler(ThreadHandler):
    """Open TCP socket and handle new client connections"""

    def __init__(
        self,
        client_handler_queue: Queue,
        address: tuple = ("0.0.0.0", 18080),
        buffer_size: int = 4096,
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
