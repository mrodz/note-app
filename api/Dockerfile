FROM node:alpine
WORKDIR /
COPY prisma ./prisma
COPY .env .
COPY package.json .
COPY package-lock.json .
COPY . .

RUN npm i
RUN prisma generate

EXPOSE 5000
CMD ["npm", "start"]