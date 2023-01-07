#!/bin/bash

docker-compose build
ID=$(docker images web-user-auth-node --format "{{.ID}}")
docker tag $ID d3lta12/web-user-auth-node:public
docker push d3lta12/web-user-auth-node:public
docker system prune