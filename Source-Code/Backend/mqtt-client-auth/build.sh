#!/bin/bash

docker-compose build
ID=$(docker images mqtt-client-auth-node --format "{{.ID}}")
docker tag $ID d3lta12/mqtt-client-auth-node:public
docker push d3lta12/mqtt-client-auth-node:public
docker system prune