import logging


def setup_logger(
    logger_name,
    log_file,
    level=logging.INFO,
    log_format="%(asctime)s %(levelname)s : %(message)s",
):
    """Setup logging function to allow for multiple loggers"""
    log_setup = logging.getLogger(logger_name)
    formatter = logging.Formatter(log_format)
    file_handler = logging.FileHandler(log_file, mode="w")
    file_handler.setFormatter(formatter)
    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)

    log_setup.setLevel(level)
    log_setup.addHandler(file_handler)
    log_setup.addHandler(stream_handler)


setup_logger("logger", "debugging.log")
logger = logging.getLogger("logger")
