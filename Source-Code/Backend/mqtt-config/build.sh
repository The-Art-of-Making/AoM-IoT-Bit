#!/bin/bash

cd ../protobufs && ./compile_protobufs.sh && cd ../mqtt-config
docker-compose build
ID=$(docker images mqtt-config-application --format "{{.ID}}")
docker tag $ID d3lta12/mqtt-config-application:public
docker push d3lta12/mqtt-config-application:public
docker system prune