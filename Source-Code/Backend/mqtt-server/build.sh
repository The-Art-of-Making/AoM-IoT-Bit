#!/bin/bash

docker-compose build
ID=$(docker images mqtt-server-rabbitmq --format "{{.ID}}")
docker tag $ID d3lta12/mqtt-server-rabbitmq:public
docker push d3lta12/mqtt-server-rabbitmq:public
docker system prune