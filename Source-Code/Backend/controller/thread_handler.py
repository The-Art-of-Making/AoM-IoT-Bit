from threading import Thread
from typing import Callable


class ThreadHandler:
    def __init__(self, target: Callable = None, daemon: bool = True):
        self.running = False
        self.thread = Thread(target=self.main)
        self.thread.daemon = daemon
        self.target = target

    def __del__(self):
        self.stop()

    def start(self, loop: bool = True) -> None:
        if loop:
            self.running = True
        self.thread.start()

    def stop(self) -> None:
        self.running = False

    def main(self) -> None:
        self.target()
        while self.running:
            self.target()
