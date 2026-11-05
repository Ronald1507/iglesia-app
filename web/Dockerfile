FROM node:20-alpine AS builder
WORKDIR /app
# VITE_API_URL=/api        → monorepo: nginx proxies /api/* al servicio api
# VITE_API_URL=https://... → standalone: el browser llama directo a la API
ARG VITE_API_URL=/api
COPY package*.json ./
RUN npm ci
COPY . .
RUN VITE_API_URL=$VITE_API_URL npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# NGINX_CONF=nginx.conf           → monorepo (con proxy a api:3000)
# NGINX_CONF=nginx.standalone.conf → standalone (solo archivos estáticos)
ARG NGINX_CONF=nginx.standalone.conf
COPY $NGINX_CONF /etc/nginx/conf.d/default.conf
EXPOSE 80
