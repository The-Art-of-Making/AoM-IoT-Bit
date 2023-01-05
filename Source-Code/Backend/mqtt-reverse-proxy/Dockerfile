FROM nginx:latest
RUN apt update && apt upgrade -y && apt autoremove -y
WORKDIR /etc/nginx/
COPY mqtt-proxy.conf mqtt-proxy.conf
COPY parser.js parser.js
RUN sed -i "1 i load_module modules/ngx_stream_js_module.so;" /etc/nginx/nginx.conf
RUN echo "include /etc/nginx/mqtt-proxy.conf;" >> /etc/nginx/nginx.conf
RUN nginx -t
WORKDIR /
RUN sed -i "2 i sed -i \"s/const ip = 'mqtt-server-lookup-service';/const ip = '\$MQTT_LOOKUP_HOST';/g\" /etc/nginx/parser.js" docker-entrypoint.sh
