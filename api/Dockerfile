FROM node:alpine
WORKDIR /
COPY prisma ./prisma
COPY .env .
COPY package.json .
COPY package-lock.json .
COPY . .

# WORKDIR /api
RUN npm i
RUN npx prisma generate

EXPOSE 5000
CMD ["npm", "run", "start"]