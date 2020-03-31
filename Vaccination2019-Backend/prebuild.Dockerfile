FROM node:9.5.0

WORKDIR /app
COPY ./package* ./

RUN npm install
