# Maple frontend

This frontend is wired to the Go backend in `D:/Desktop/maple_sql/backend`.

Development flow:

```bash
# 1. Start PostgreSQL
cd D:/Desktop/maple_sql/db/postgres
docker compose up -d

# 2. Run backend migrations
cd D:/Desktop/maple_sql/backend
go run ./cmd/migrate up

# 3. Start backend API
go run ./cmd/api

# 4. Start this frontend
cd D:/Desktop/maple
npm run dev
```

The frontend calls the backend through Vite at `/api`, proxied to `http://127.0.0.1:8080`.

Production routes and all locale dictionaries are bundled statically. Remote news, rankings, maps, wiki, guide, tool, and upcoming-update data is requested only through the backend's database-backed static snapshot endpoint. The backend stores the first successful response in PostgreSQL and refreshes stored snapshots every 12 hours; browsers never contact those upstream data APIs directly.
