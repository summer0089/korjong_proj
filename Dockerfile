# Syntax = docker/dockerfile:1

# Stage 1: Base image
FROM node:22.23.3-alpine3.24 AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Stage 2: Install dependencies
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Stage 3: Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ปิด Next.js Telemetry ในระหว่าง Build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# รันคำสั่ง build (Next.js จะสร้างไฟล์ standalone)
RUN npm run build

# Stage 4: Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# สร้าง non-root user เพื่อความปลอดภัย
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# คัดลอกไฟล์ static และไฟล์ build แบบ standalone
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# กำหนดสิทธิ์ให้โฟลเดอร์ .next ก่อน copy standalone
RUN mkdir .next && chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
