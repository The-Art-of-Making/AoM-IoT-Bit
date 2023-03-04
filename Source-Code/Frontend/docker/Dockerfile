FROM node:latest
RUN npm install pm2 -g
RUN mkdir -p /auth-template/backend
RUN mkdir /auth-template/frontend
WORKDIR /auth-template
COPY backend /auth-template/backend
COPY frontend /auth-template/frontend
WORKDIR /auth-template/frontend
RUN npm install .
RUN npm run build
WORKDIR /auth-template/backend
RUN npm install .
RUN echo "pm2 start server.js" >> run_pm2.sh
RUN echo "tail -F /dev/null" >> run_pm2.sh
ENTRYPOINT [ "/bin/sh", "run_pm2.sh" ]