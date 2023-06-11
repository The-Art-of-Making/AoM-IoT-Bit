#!/bin/bash

docker-compose build
ID=$(docker images iot-web-handler-node --format "{{.ID}}")
docker tag $ID d3lta12/iot-web-handler-node:public
docker push d3lta12/iot-web-handler-node:public
docker system prune