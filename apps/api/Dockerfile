FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY src ./src

EXPOSE 8000

# Using tsx since user added it
CMD ["npm", "run", "start"]