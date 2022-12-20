from subprocess import CalledProcessError, check_output, call
from time import sleep


class PasswordHandler:
    """Add, remove users and passwords from mosquitto password file"""

    def __init__(self, filename: str = "/passwords"):
        self.filename = filename
        self.file_created = False
        while True:
            try:
                self.pid = check_output(["pidof", "mosquitto"]).decode().strip()
                break
            except CalledProcessError:
                sleep(1)
                continue

    def reload_broker(self) -> None:
        """Reload broker after updating password file"""
        call(["kill", "-HUP", self.pid])

    def add_user(self, username: str, password: str) -> None:
        """Add user and password to passwords file"""
        if self.file_created:
            call(["mosquitto_passwd", "-b", self.filename, username, password])
        else:
            call(["mosquitto_passwd", "-c", "-b", self.filename, username, password])
            self.file_created = True
        self.reload_broker()

    def delete_user(self, username: str) -> None:
        """Remove uesrs from passwords file"""
        if self.file_created:
            call(["mosquitto_passwd", "-D", self.filename, username])
            self.reload_broker()
