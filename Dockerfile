# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/ .
RUN npm run test

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /app/node_modules ./node_modules
COPY server/ .
USER appuser
EXPOSE 5001
CMD ["node", "index.js"]
