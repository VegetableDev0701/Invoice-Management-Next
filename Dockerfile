FROM node:18-bookworm-slim AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-bookworm-slim AS runtime
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
EXPOSE 3000
USER node

CMD ["npm", "start"]

# For Dev
# COPY ./.creds/stak-app-b348a0fc8a74.json /app/.creds/creds.json
# ENV GOOGLE_APPLICATION_CREDENTIALS=/app/.creds/creds.json