FROM golang:1.24-alpine AS api-build

WORKDIR /src

COPY backend/maplehub-api/go.mod backend/maplehub-api/go.sum ./
RUN go mod download

COPY backend/maplehub-api ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/maplehub-api ./cmd/api

FROM node:lts-alpine AS dependencies

ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NPM_CONFIG_FUND=false

WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM node:lts-alpine AS build

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_MAPLE_SQL_API_BASE_URL=/api
ENV MAPLE_SQL_API_ORIGIN=http://127.0.0.1:8081

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . ./
RUN LIBRETRANSLATE_API_URL= LOCALIZATION_DATABASE_URL= npm run build

FROM node:lts-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV APP_ENV=production
ENV APP_ADDR=127.0.0.1:8081
ENV APP_BASE_URL=https://mpstorys.com

RUN apk add --no-cache ca-certificates

COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/supabase ./supabase
COPY --from=api-build /out/maplehub-api ./maplehub-api
COPY --from=build /app/scripts/start-railway-all.mjs ./start-railway-all.mjs
# Next's output tracer currently omits the ESM entry files selected by React Router's package exports.
COPY --from=dependencies /app/node_modules/react-router-dom ./node_modules/react-router-dom
COPY --from=dependencies /app/node_modules/react-router ./node_modules/react-router

CMD ["node", "start-railway-all.mjs"]
