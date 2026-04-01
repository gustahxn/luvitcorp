FROM node:20-alpine

WORKDIR /app

COPY package*json ./
RUN npm install --silent --no-fund --no-audit

COPY . .

EXPOSE 3001

CMD ["node", "src/server.js"]
