# FROM node:23-alpine AS builder
# ARG DOCKER_BUILD="1"
# WORKDIR /app

# COPY . . 

# # Install pnpm
# RUN corepack enable pnpm

# RUN pnpm install --frozen-lockfile

# # Makes the next output standalone
# # https://github.com/vercel/next.js/discussions/65511
# ENV NEXT_STANDALONE_OUTPUT="true"

# RUN pnpm build

# FROM node:23-alpine AS runner

# WORKDIR /app

# ENV NODE_ENV=production
# # disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED=1

# RUN addgroup --system --gid 1001 nodejs
# RUN adduser --system --uid 1001 nextjs

# COPY --from=builder /app/public ./public

# # Automatically leverage output traces to reduce image size
# # https://nextjs.org/docs/advanced-features/output-file-tracing
# COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# # Copy migrations content
# COPY --from=builder /app/src/lib/db/migrations ./src/lib/db/migrations

# USER nextjs

# ENV PORT=7070
# ENV HOSTNAME="0.0.0.0"

# EXPOSE 3000

# # server.js is created by next build from the standalone output
# # https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
# CMD ["node", "server.js"]


FROM node:23-alpine AS builder
ARG DOCKER_BUILD="1"
WORKDIR /app

# Set DNS for network resolution
RUN echo "nameserver 8.8.8.8" > /etc/resolv.conf && \
    echo "nameserver 8.8.4.4" >> /etc/resolv.conf

# Install pnpm via npm to avoid corepack signature issues
RUN npm install -g pnpm@10.2.1

# Copy configuration files first
COPY package.json pnpm-lock.yaml tsconfig.json next.config.ts ./

# Set DNS again before install
RUN echo "nameserver 8.8.8.8" > /etc/resolv.conf && \
    echo "nameserver 8.8.4.4" >> /etc/resolv.conf

# Install dependencies (without running scripts first)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Now copy all source code
COPY . .

# Makes the next output standalone
ENV NEXT_STANDALONE_OUTPUT="true"
ENV NO_HTTPS="1"

# Build application with Webpack (not Turbopack) for better compatibility
RUN pnpm build

FROM node:23-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NO_HTTPS=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy migrations
COPY --from=builder --chown=nextjs:nodejs /app/src/lib/db/migrations ./src/lib/db/migrations

USER nextjs

ENV PORT=7070
ENV HOSTNAME="0.0.0.0"

EXPOSE 7070

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:7070/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]