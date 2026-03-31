FROM node:20-slim
ENV NODE_ENV=production
RUN groupadd -g 1001 appgroup && \
    useradd -u 1001 -g appgroup -s /bin/sh appuser
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npx prisma generate
RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE 5000
CMD ["node", "index.js"]
