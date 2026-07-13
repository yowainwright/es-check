ARG NODE_VERSION=24-alpine
ARG NODE_DIGEST=sha256:d1b3b4da11eefd5941e7f0b9cf17783fc99d9c6fc34884a665f40a06dbdfc94f
FROM node:${NODE_VERSION}@${NODE_DIGEST}

RUN corepack enable
RUN corepack install --global pnpm@10.30.0 yarn@1.22.22

WORKDIR /app

ARG ES_CHECK_VERSION
RUN npm install --global "es-check@${ES_CHECK_VERSION}"

COPY scripts/release /app/release
COPY scripts/release/fixtures /app/fixtures

ENTRYPOINT ["node", "/app/release/release-test-container.mjs"]
CMD ["cli"]
