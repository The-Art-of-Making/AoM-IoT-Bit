from os import environ
from signal import SIGTERM, signal, SIGINT
from socket import socket, AF_INET, SOCK_STREAM
from ssl import SSLContext, SSLSocket, PROTOCOL_TLS_SERVER
from struct import pack

from password_handler import PasswordHandler

# Client format: 0x00 0X0A/0x0D len (36 to 255) username (36) password (len-36)
# Server format: 0xFF 0x0A/0x0D 0x00/0x01

# Get environment variables for password file, ip, port, cert and key files
password_file = environ.get("PASSWD_FILE", "/passwords")
ip = environ.get("IP_ADDR", "0.0.0.0")
port = int(environ.get("PORT", 9443))
cert_file = environ.get("CERT", "cert.pem")
key_file = environ.get("KEY", "key.pem")

ph = PasswordHandler(password_file)

# Create SSL context
context = SSLContext(PROTOCOL_TLS_SERVER)
context.load_cert_chain(cert_file, key_file)


# Create TCP socket
server = socket(AF_INET, SOCK_STREAM)
server.bind((ip, port))
server.listen()

# Signal handler
def handler(signal_received, frame):
    print(f"Recd {signal_received} from {frame}")
    server.close()
    print("SIGTERM or SIGINT or CTRL-C detected. Exiting gracefully")
    exit(0)


# Send response to client
def send_response(connection: SSLSocket, msg_type: int, success: int) -> None:
    data = pack("=3B", *(0xFF, msg_type, success))
    connection.send(data)


# Listen for SIGINT and SIGTERM signals
signal(SIGINT, handler)
signal(SIGTERM, handler)

# Wrap socket with SSL and listen for connections
with context.wrap_socket(server, server_side=True) as tls:
    while True:
        connection, address = tls.accept()
        data = connection.recv(1024)

        # Verify packet format and handle data
        if data[0] == 0x00:
            length = data[2]
            username = data[3:39].decode()
            if data[1] == 0x0A:
                password = data[39 : 3 + length]
                try:
                    # password added successfully
                    ph.add_user(username, password)
                    send_response(connection, 0x0A, 0x00)
                except:
                    # error adding password
                    send_response(connection, 0x0A, 0x01)
            if data[1] == 0x0D:
                try:
                    # password deleted successfully
                    ph.delete_user(username)
                    send_response(connection, 0x0D, 0x00)
                except:
                    # error deleteing password
                    send_response(connection, 0x0D, 0x01)
        else:
            send_response(connection, 0x00, 0x01)
