FROM node:18-alpine

# Install build tools for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install
RUN npm i -g serve

COPY . .

ARG VITE_API_HOST
ARG VITE_UNSPLASH_CLIENT_ID
ARG VITE_MAPKIT_TOKEN
ENV VITE_API_HOST=$VITE_API_HOST
ENV VITE_UNSPLASH_CLIENT_ID=$VITE_UNSPLASH_CLIENT_ID
ENV VITE_MAPKIT_TOKEN=$VITE_MAPKIT_TOKEN

RUN npm run build

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
