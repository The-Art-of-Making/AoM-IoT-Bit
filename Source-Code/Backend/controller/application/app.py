from flask import Flask, jsonify, request
from signal import signal, SIGTERM, SIGINT

from controller import Controller
from logger import logger

app = Flask(__name__)
controller = Controller()


@app.route("/", methods=["POST"])
def connect():
    request_data = request.get_json()
    response = {"success": False, "error": "Incorrect Client UUID and/or Client Key"}
    if not request_data:
        response["error"] = "Missing Client UUID and Client Key"
    if "client_uuid" not in request_data:
        return jsonify(response)
    if "client_key" not in request_data:
        return jsonify(response)
    success, message = controller.handle_client_connect(
        request_data["client_uuid"], request_data["client_key"]
    )
    response["success"] = success
    response["error"] = message
    if success:
        del response["error"]
        response["message"] = message
    return jsonify(response)


def handler(signal_received, frame):
    logger.info(f"Recd {signal_received} from {frame}")
    logger.info("SIGTERM or SIGINT or CTRL-C detected. Exiting gracefully")
    exit(0)


signal(SIGINT, handler)
signal(SIGTERM, handler)


if __name__ == "__main__":
    app.run(host="0.0.0.0")
