#!/bin/bash

mkdir -p application/cml/out
cd ../../cml
docker run -v $PWD:/usr/local/cml -it cml:latest /bin/sh -c 'cd /usr/local/cml && ./generate.sh'
cp -r out/python ../Backend/mqtt-config/application/cml/out
cd ../Backend/mqtt-config
docker-compose build
ID=$(docker images mqtt-config-application --format "{{.ID}}")
docker tag $ID d3lta12/mqtt-config-application:public
docker push d3lta12/mqtt-config-application:public
docker system prune