FROM python:latest
RUN apt update && apt upgrade -y && apt autoremove -y
WORKDIR /
COPY application controller
WORKDIR /controller
RUN pip3 install -r requirements.txt
ENTRYPOINT [ "waitress-serve --host $HOST --port $PORT app:app" ]