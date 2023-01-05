#!/bin/bash

docker-compose build
ID=$(docker images mqtt-server-lookup-node --format "{{.ID}}")
docker tag $ID d3lta12/mqtt-server-lookup-node:public
docker push d3lta12/mqtt-server-lookup-node:public
docker system prune