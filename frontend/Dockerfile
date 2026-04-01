# BUILD do react
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install --silent --no-fund --no-audit
COPY . .
RUN npm run build

# Nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
