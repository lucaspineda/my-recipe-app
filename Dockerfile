# Two stages: build with every dependency, then ship only Next.js's standalone
# server (output: 'standalone' in next.config.mjs). The image Cloud Run pulls is
# ~65 MB compressed instead of ~500 MB, so the push and the revision's image
# import take seconds instead of minutes. See docs/faster-deploys.md.
#
# Cloud Build runs the classic Docker builder for `gcloud run deploy --source`,
# so this file must not use BuildKit-only syntax such as RUN --mount.

FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
# --no-audit: npm's vulnerability check adds ~2.5 min to every build.
RUN npm ci --no-audit --no-fund

# Includes .env, which supplies the NEXT_PUBLIC_* values next build inlines.
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=8080

# public/ comes from the builder because next-pwa writes sw.js there during the build.
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 8080
CMD ["node", "server.js"]
