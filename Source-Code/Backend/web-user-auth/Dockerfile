FROM node:latest
RUN apt update && apt upgrade -y && apt autoremove -y
WORKDIR /
RUN mkdir /web-user-auth
WORKDIR /web-user-auth
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install .
COPY config config
COPY models models
COPY routes routes
COPY validation validation
COPY server.js server.js
WORKDIR /
COPY frontend frontend
WORKDIR /web-user-auth
ENTRYPOINT [ "node", "server.js" ]
