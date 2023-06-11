FROM python:latest
RUN apt update && apt upgrade -y && apt autoremove -y
WORKDIR /
COPY application application
WORKDIR /application
RUN pip3 install -r requirements.txt
ENTRYPOINT [ "python3", "main.py" ]
