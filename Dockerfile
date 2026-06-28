FROM node:20-bookworm AS frontend

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_BASE_URL=/api
ARG VITE_FASTAPI_BASE_URL=/api/v1
ARG VITE_FASTAPI_WS_URL=

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_FASTAPI_BASE_URL=$VITE_FASTAPI_BASE_URL
ENV VITE_FASTAPI_WS_URL=$VITE_FASTAPI_WS_URL

RUN npm run build

FROM python:3.12-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/backend

COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend ./backend
COPY --from=frontend /app/dist ./dist
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh && chmod -R a+rwX ./dist

EXPOSE 8000

CMD ["./docker-entrypoint.sh"]
