FROM node:20-slim

RUN apt-get update && apt-get upgrade --yes && apt-get clean

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm clean-install
COPY . .
RUN npm run lint
RUN npm run prettier
RUN npm run dist
CMD ["npm", "run", "test"]
