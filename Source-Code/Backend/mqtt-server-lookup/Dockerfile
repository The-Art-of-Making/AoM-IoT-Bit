FROM node:latest
RUN apt update && apt upgrade -y && apt autoremove -y
WORKDIR /
RUN mkdir /mqtt-server-lookup
WORKDIR /mqtt-server-lookup
COPY models models
COPY routes routes
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY server.js server.js
RUN npm install .
ENTRYPOINT [ "node", "server.js" ]
