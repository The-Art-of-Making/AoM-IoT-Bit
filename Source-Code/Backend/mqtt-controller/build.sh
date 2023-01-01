#!/bin/bash

docker-compose build
ID=$(docker images mqtt-controller-application --format "{{.ID}}")
docker tag $ID d3lta12/mqtt-controller-application:public
docker push d3lta12/mqtt-controller-application:public
docker system prune