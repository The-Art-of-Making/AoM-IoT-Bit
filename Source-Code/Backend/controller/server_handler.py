import asyncio
from time import time
from queue import Queue
from uuid import uuid4

from database_handler import create_server
from logger import logger

ACTIVITY_CHECK_INTERVAL = 10  # check for inactive MQTT servers every minute
INACTIVITY_THRESHOLD = (
    60  # shutdown MQTT server if more than a minute elapsed without a heartbeat
)


class ServerHandler:
    """Represents MQTT server
    Start, stop, and check activity of MQTT server"""

    def __init__(
        self,
        user: str,
        server_removal_queue: Queue,
        activity_check_interval: int = ACTIVITY_CHECK_INTERVAL,
        inactivity_threshold: int = INACTIVITY_THRESHOLD,
    ):
        self.uuid = str(uuid4())
        self.user = user
        self.server_removal_queue = server_removal_queue
        self.activity_check_interval = activity_check_interval
        self.inactivity_threshold = inactivity_threshold
        self.last_client_count_update = time()
        self.client_count = 0
        self.running = False
        self.start()

    # avoid potential recursive loop?
    # def __del__(self):
    #     self.shutdown()

    def start(self) -> bool:
        """Start new MQTT server"""
        try:
            server_info = {"user": self.user, "uuid": self.uuid}
            if create_server(server_info):
                # load config
                # pass new uuid
                # send signal to kubernetes to start container
                # update document info (addr, port) if container started
                # delete server document if failed to start container
                self.running = True
                asyncio.get_event_loop().create_task(self.check_inactive())
                logger.info("Server started")
        except:
            logger.warning("Failed to start sever")
            return False
        return True

    def shutdown(self):
        """Stutdown MQTT server"""
        # save config and states to db
        # send signal to kubernetes to terminate container
        self.running = False
        self.server_removal_queue.put(self.uuid)
        logger.info("Server stopped")

    def update_client_count(self, count) -> None:
        """Update client count if it changes and update last count update time"""
        if count != self.client_count:
            self.client_count = count
            self.last_client_count_update = time()

    def get_server_info(self):
        pass

    async def check_inactive(self) -> None:
        """Checks if client count has been 0 for at least the threshold duration
        and shuts down server if true"""
        while self.running:
            logger.info("Checking activity...")
            now = time()
            if (
                self.client_count == 0
                and now - self.last_client_count_update >= self.inactivity_threshold
            ):
                self.shutdown()
            await asyncio.sleep(self.activity_check_interval)
