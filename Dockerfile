FROM node:24-alpine
WORKDIR /app
COPY package.json ./
COPY server ./server
COPY scripts ./scripts
COPY public ./public
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4173 DATA_DIR=/data
RUN mkdir /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 4173
CMD ["node","server/index.mjs"]
