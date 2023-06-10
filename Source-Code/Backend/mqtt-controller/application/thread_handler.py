"""Wrapper for Python threading"""

from threading import Thread
from typing import Callable


class ThreadHandler:
    """Base class for classes utilizing threaded process"""

    def __init__(self, target: Callable = None, daemon: bool = True):
        self.running = False
        self.thread = Thread(target=self.main)
        self.thread.daemon = daemon
        self.target = target

    def __del__(self):
        self.stop()

    def start(self, loop: bool = True) -> None:
        """Start the thread"""
        if loop:
            self.running = True
        self.thread.start()

    def stop(self) -> None:
        """Stop the thread"""
        self.running = False

    def is_running(self) -> bool:
        """Check if the thread is running"""
        return self.running

    def main(self) -> None:
        """Call the target threaded function"""
        self.target()
        while self.running:
            self.target()
