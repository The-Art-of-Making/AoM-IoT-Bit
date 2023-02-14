#!/bin/bash

cd ../protobufs && ./compile_protobufs.sh && cd ../mqtt-controller
docker-compose build
ID=$(docker images mqtt-controller-application --format "{{.ID}}")
docker tag $ID d3lta12/mqtt-controller-application:public
docker push d3lta12/mqtt-controller-application:public
docker system prune