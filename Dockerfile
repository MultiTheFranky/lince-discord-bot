# Docker file with Node 16 and NPM
FROM node:16-alpine3.11

# Set the working directory
WORKDIR /app

# Copy dist files
COPY dist/ /app/dist/

# Expose the port
EXPOSE 3000

# Start the app
CMD ["npm", "run", "serve"]