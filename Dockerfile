# syntax=docker/dockerfile:1
# Build from the repository root:
#   docker build -t flambe --build-arg GIT_SHA=$(git rev-parse HEAD) .

ARG GIT_SHA=unknown

FROM node:22-bookworm-slim AS assets
ARG GIT_SHA=unknown
ENV VITE_GIT_SHA=$GIT_SHA
WORKDIR /app/frontend
COPY frontend/ ./
RUN npm ci && npm run build

FROM elixir:1.18.3-otp-27 AS builder
ARG GIT_SHA=unknown
ENV GIT_SHA=$GIT_SHA
WORKDIR /app

RUN apt-get update -y && apt-get install -y build-essential git \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

ENV MIX_ENV="prod"

RUN mix local.hex --force && mix local.rebar --force

COPY backend/mix.exs backend/mix.lock ./
COPY backend/config config
RUN mix deps.get --only $MIX_ENV && mix deps.compile

COPY backend/priv priv
COPY backend/lib lib
COPY backend/rel rel
COPY --from=assets /app/backend/priv/static/assets priv/static/assets
# Vite also syncs root-scoped PWA install files into priv/static during build.
COPY --from=assets /app/backend/priv/static/manifest.webmanifest priv/static/manifest.webmanifest
COPY --from=assets /app/backend/priv/static/sw.js priv/static/sw.js
COPY --from=assets /app/backend/priv/static/apple-touch-icon.png priv/static/apple-touch-icon.png
COPY --from=assets /app/backend/priv/static/pwa-192.png priv/static/pwa-192.png
COPY --from=assets /app/backend/priv/static/pwa-512.png priv/static/pwa-512.png

RUN chmod +x rel/overlays/bin/server rel/overlays/bin/migrate \
  && mix compile \
  && mix release

FROM debian:bookworm-slim

ARG GIT_SHA=unknown
ENV GIT_SHA=$GIT_SHA

RUN apt-get update -y && \
  apt-get install -y libstdc++6 openssl libncurses6 locales ca-certificates \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && locale-gen

ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8
ENV MIX_ENV="prod"
ENV PORT=4000

WORKDIR /app
RUN chown nobody /app

COPY --from=builder --chown=nobody:root /app/_build/prod/rel/flambe_next ./

USER nobody
CMD ["/app/bin/server"]
