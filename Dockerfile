FROM node:23-alpine AS builder
ENV NODE_ENV production
WORKDIR /app
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --include prod --include dev

FROM node:23-alpine AS release
WORKDIR /app

COPY --from=builder /app /app
COPY . .
RUN npm run build
CMD node build/index.js