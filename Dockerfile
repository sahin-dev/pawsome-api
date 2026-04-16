FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /backend
COPY ./ .
RUN pnpm i
RUN pnpm build
CMD [ "pnpm","start:dev" ]

FROM builder AS final
WORKDIR /app
EXPOSE 3000

COPY --from=builder /backend/package.json ./
COPY --from=builder /backend/pnpm-lock.yaml ./

RUN pnpm install --prod

COPY --from=builder /backend/dist ./dist

CMD [ "pnpm" , "start:prod"]