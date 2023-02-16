#!/bin/bash

cd ../protobufs && ./compile_protobufs.sh && cd ../mqtt-client-actions
docker-compose build
ID=$(docker images mqtt-client-actions-application --format "{{.ID}}")
docker tag $ID d3lta12/mqtt-client-actions-application:public
docker push d3lta12/mqtt-client-actions-application:public
docker system prune