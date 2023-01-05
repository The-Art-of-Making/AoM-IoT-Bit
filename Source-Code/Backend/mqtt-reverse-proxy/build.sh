#!/bin/bash

docker-compose build
ID=$(docker images mqtt-reverse-proxy-nginx --format "{{.ID}}")
docker tag $ID d3lta12/mqtt-reverse-proxy-nginx:public
docker push d3lta12/mqtt-reverse-proxy-nginx:public
docker system prune