#!/bin/bash

rm -Rf frontend/build
npm run build --prefix ../../Frontend/
mkdir -p frontend
cp -r ../../Frontend/build frontend/build
docker-compose build
ID=$(docker images web-user-auth-node --format "{{.ID}}")
docker tag $ID d3lta12/web-user-auth-node:public
docker push d3lta12/web-user-auth-node:public
docker system prune
