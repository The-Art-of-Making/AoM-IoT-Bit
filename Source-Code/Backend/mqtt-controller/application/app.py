from flask import Flask, jsonify, request
from flask_cors import CORS
from signal import signal, SIGTERM, SIGINT

from controller import Controller
from logger import logger

app = Flask(__name__)
CORS(app)
controller = Controller()

# TODO verify user in database
# TODO reduce code duplication - need authentication method


@app.route("/start_server", methods=["POST"])
def start_server():
    """Endpoint to start new server"""
    response = {
        "success": False,
        "error": "Incorrect User",
    }
    request_data = request.get_json()
    if not request_data:
        response["error"] = "User is required"
    if "user" not in request_data.keys():
        return jsonify(response)
    success, message = controller.publish_start_message(user=request_data["user"])
    response["success"] = success
    response["error"] = message
    if success:
        del response["error"]
        response["status"] = message
    return jsonify(response)


@app.route("/shutdown_server", methods=["POST"])
def stop_server():
    """Endpoint to start new server"""
    response = {
        "success": False,
        "error": "Incorrect User",
    }
    request_data = request.get_json()
    if not request_data:
        response["error"] = "User is required"
    if "user" not in request_data.keys():
        return jsonify(response)
    success, message = controller.publish_shutdown_message(user=request_data["user"])
    response["success"] = success
    response["error"] = message
    if success:
        del response["error"]
        response["status"] = message
    return jsonify(response)


@app.route("/update_config", methods=["POST"])
def update_config():
    """Endpoint to update the config of a running server"""
    response = {
        "success": False,
        "error": "Incorrect User",
    }
    request_data = request.get_json()
    if not request_data:
        response["error"] = "User"
    if "user" not in request_data.keys():
        return jsonify(response)
    try:
        controller.get_server_config(user=request_data["user"])
        success = True
        message = "Updating server config"
    except:
        response["error"] = "Encountered unknown error"
    response["success"] = success
    response["error"] = message
    if success:
        del response["error"]
        response["status"] = message
    return jsonify(response)


def signal_handler(signal_received, frame):
    """Perform graceful shutdown on SIGTERM or SIGINT"""
    logger.info(f"Recd {signal_received} from {frame}")
    logger.info("SIGTERM or SIGINT or CTRL-C detected. Exiting gracefully")
    controller.stop_controller()
    exit(0)


signal(SIGINT, signal_handler)
signal(SIGTERM, signal_handler)


if __name__ == "__main__":
    app.run(host="0.0.0.0")
