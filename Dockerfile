# Builder Stage
FROM node:12-alpine as builder

WORKDIR /home/node/app

# Copy command allows caching when files haven't changed
COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

#-------------------
# Prod Stage
FROM node:12-alpine as prod

# Set permissions for User node in working directory
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

# Copy js files from builder stage
COPY --from=builder ./home/node/app/build ./build

# Copy command allows caching when files haven't changed
COPY package*.json ./

USER node 

RUN npm ci --production

EXPOSE 3000

CMD ["npm", "start"]