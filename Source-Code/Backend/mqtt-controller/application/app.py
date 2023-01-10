from flask import Flask, jsonify, request
from signal import signal, SIGTERM, SIGINT

from controller import Controller
from logger import logger

app = Flask(__name__)
controller = Controller()


@app.route("/", methods=["POST"])
def connect():
    response = {
        "success": False,
        "error": "Incorrect Client Username or Client Password",
    }
    request_data = request.get_json()
    if not request_data:
        response["error"] = "Client Username and Client Password are required"
    if "username" not in request_data:
        return jsonify(response)
    if "password" not in request_data:
        return jsonify(response)
    # TODO authenticate client
    success, message = controller.handle_client_connect(
        request_data["username"], request_data["password"]
    )
    response["success"] = success
    response["error"] = message
    if success:
        del response["error"]
        response["status"] = message
    return jsonify(response)


def handler(signal_received, frame):
    logger.info(f"Recd {signal_received} from {frame}")
    logger.info("SIGTERM or SIGINT or CTRL-C detected. Exiting gracefully")
    controller.stop_controller()
    exit(0)


signal(SIGINT, handler)
signal(SIGTERM, handler)


if __name__ == "__main__":
    app.run(host="0.0.0.0")
