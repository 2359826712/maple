FROM node:lts-alpine AS dependencies

ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NPM_CONFIG_FUND=false

WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM node:lts-alpine AS build

ENV NEXT_TELEMETRY_DISABLED=1

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

COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/supabase ./supabase
# Next's output tracer currently omits the ESM entry files selected by React Router's package exports.
COPY --from=dependencies /app/node_modules/react-router-dom ./node_modules/react-router-dom
COPY --from=dependencies /app/node_modules/react-router ./node_modules/react-router

CMD ["node", "server.js"]
