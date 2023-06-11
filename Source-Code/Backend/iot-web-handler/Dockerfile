FROM node:latest
RUN apt update && apt upgrade -y && apt autoremove -y
WORKDIR /
RUN mkdir /iot-web-handler
WORKDIR /iot-web-handler
COPY models models
COPY routes routes
COPY validation validation
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY server.js server.js
RUN npm install .
ENTRYPOINT [ "node", "server.js" ]
