#!/bin/bash

docker-compose build
ID=$(docker images mqtt-server-eclipse-mosquitto --format "{{.ID}}")
docker tag $ID d3lta12/mqtt-server-eclipse-mosquitto:public
docker push d3lta12/mqtt-server-eclipse-mosquitto:public
docker system prune