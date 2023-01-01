FROM python:latest
RUN apt update && apt upgrade -y && apt autoremove -y
WORKDIR /
COPY application controller
WORKDIR /controller
RUN pip3 install -r requirements.txt
RUN echo "#!/bin/bash" > entrypoint.sh
RUN echo "waitress-serve --host \$HOST --port \$PORT app:app" >> entrypoint.sh
ENTRYPOINT [ "sh", "entrypoint.sh" ]
