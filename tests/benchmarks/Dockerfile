FROM node:24

RUN corepack enable && corepack prepare pnpm@11.0.3 --activate

WORKDIR /app

COPY package*.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY scripts ./scripts
RUN pnpm install

COPY lib ./lib
COPY tests/helpers.js ./tests/helpers.js
COPY tests/benchmarks ./tests/benchmarks

RUN pnpm add -D lodash axios react moment express chalk es-check-previous@npm:es-check@9.6.3
RUN node tests/benchmarks/download-libs.js

CMD ["node", "tests/benchmarks/compare-tools.js", "10", "tests/benchmarks/real-libs"]
