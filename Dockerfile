FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY app.js ./
COPY public ./public
COPY src ./src
COPY .env.example .env
EXPOSE 3333
CMD ["node", "app"]
