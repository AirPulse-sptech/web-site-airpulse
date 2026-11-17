FROM node:20-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
COPY .env.example .env
EXPOSE 3333
CMD ["node", "app"]