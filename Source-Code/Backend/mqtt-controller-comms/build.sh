#!/bin/bash

docker-compose build
ID=$(docker images mqtt-controller-comms-rabbitmq --format "{{.ID}}")
docker tag $ID d3lta12/mqtt-controller-comms-rabbitmq:public
docker push d3lta12/mqtt-controller-comms-rabbitmq:public
docker system prune