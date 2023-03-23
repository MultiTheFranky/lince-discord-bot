# Docker file with Node 16 and Yarn 1.22.10
FROM node:16-alpine3.11

# Set the working directory
WORKDIR /app

# Copy package.json and yarn.lock
COPY package.json /app 
COPY yarn.lock /app

RUN npm install -g -s --no-progress yarn && \
    yarn && \
    yarn build && \
    yarn cache clean

# Expose the port
EXPOSE 3000

# Start the app
CMD ["yarn", "serve"]