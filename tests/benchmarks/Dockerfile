FROM node:24

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package*.json pnpm-lock.yaml ./
COPY scripts ./scripts
RUN pnpm install

COPY lib ./lib
COPY tests/benchmarks ./tests/benchmarks

RUN pnpm add -D lodash axios react moment express chalk are-you-es5 @swc/core @babel/parser eslint eslint-plugin-es5
RUN node tests/benchmarks/download-libs.js

CMD ["node", "tests/benchmarks/compare-tools.js", "3", "tests/benchmarks/real-libs"]
