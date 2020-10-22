FROM node:14-alpine as builder
ENV NODE_ENV=production
WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install --production --silent
COPY tsconfig.json .
COPY public public
COPY src src
RUN npm run build

FROM node:14-alpine as deployer
RUN npm install -g firebase-tools
COPY firebase.json .
COPY --from=builder /app/build build
CMD ["firebase", "deploy", "--project", "trentiemeciel"]


