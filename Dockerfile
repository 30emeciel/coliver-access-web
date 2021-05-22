FROM node:16
WORKDIR /work
COPY package*.json ./
RUN npm install --production --silent
COPY .env .
ENV REACT_APP_VERSION=dev
COPY .eslintrc craco.config.js tsconfig.json ./
COPY public ./public
COPY src ./src
RUN npm run build
