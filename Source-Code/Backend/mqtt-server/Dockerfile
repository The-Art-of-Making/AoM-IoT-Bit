FROM eclipse-mosquitto:latest
RUN apk update
RUN apk add python3 openssl
RUN echo "listener 1883 0.0.0.0" > /mosquitto/config/mosquitto.conf
RUN echo "password_file /passwords" >> /mosquitto/config/mosquitto.conf
RUN echo "listener 9001 0.0.0.0" >> /mosquitto/config/mosquitto.conf
RUN echo "protocol websockets" >> /mosquitto/config/mosquitto.conf
WORKDIR /
RUN touch passwords
COPY password_server.py password_server.py
COPY password_handler.py password_handler.py
# TODO cleanup python password server start
# RUN sed -i "10 i /usr/bin/python3 /password_server.py &" docker-entrypoint.sh
RUN echo "@reboot /usr/bin/python3 /password_server.py" >> /etc/crontabs/root
ENV CERT_SUBJ="/C=US/ST=PA/L=Pittsburgh/O=AoM/OU=MGS/CN=delta12/emailAddress=bte12@pitt.edu"
RUN sed -i "10 i openssl req -new -x509 -days 365 -nodes -out cert.pem -keyout key.pem -subj ${CERT_SUBJ}" docker-entrypoint.sh
RUN sed -i "10 i /usr/sbin/crond" docker-entrypoint.sh
