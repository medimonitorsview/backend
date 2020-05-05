FROM node:10
ADD ./package.json ./package-lock.json /backend/
WORKDIR /backend
RUN npm ci
ADD . /backend/
CMD ["node","app.js"]