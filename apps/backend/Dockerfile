FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

RUN groupadd --system app \
  && useradd --system --gid app --home-dir /app --shell /usr/sbin/nologin app

COPY dist/apps/backend/package.json dist/apps/backend/pnpm-lock.yaml ./
COPY --chown=app:app dist/apps/backend/node_modules ./node_modules
COPY --chown=app:app dist/apps/backend/main.js ./
COPY --chown=app:app dist/apps/backend/mail ./mail

RUN chown app:app package.json pnpm-lock.yaml

USER app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "main.js"]
