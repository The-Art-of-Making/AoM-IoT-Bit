FROM rabbitmq:latest
RUN rabbitmq-plugins enable rabbitmq_mqtt
RUN rabbitmq-plugins enable rabbitmq_auth_backend_http
RUN rabbitmq-plugins enable rabbitmq_auth_backend_cache
# RUN rabbitmq-plugins enable rabbitmq_management
COPY rabbitmq.conf /etc/rabbitmq/rabbitmq.conf
