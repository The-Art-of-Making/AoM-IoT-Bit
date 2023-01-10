FROM rabbitmq:latest
RUN rabbitmq-plugins enable rabbitmq_mqtt
RUN rabbitmq-plugins enable rabbitmq_auth_backend_http
RUN rabbitmq-plugins enable rabbitmq_auth_backend_cache
# TODO enable rabbitmq_management to get number of open connections
# RUN rabbitmq-plugins enable rabbitmq_management
COPY rabbitmq.conf /etc/rabbitmq/rabbitmq.conf
