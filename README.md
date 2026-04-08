# Idea Incubator

Idea Incubator is a full-stack demo with:

- A Next.js frontend for creating and refining ideas into structured MVP plans
- A FastAPI backend for idea CRUD, version generation, and OpenRouter integration
- PostgreSQL for storing ideas and generated versions

## Project Structure

- `app/`: Next.js App Router entrypoint and colocated UI components
- `backend/app/`: FastAPI app split into routers, models, schemas, db, and services
- `docker-compose.yml`: local multi-service stack for frontend, backend, and Postgres

## Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in `OPENROUTER_API_KEY`
3. Adjust the other values only if needed

Example:

```env
POSTGRES_DB=idea_incubator
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
DATABASE_URL=postgresql+psycopg://postgres:postgres@postgres:5432/idea_incubator
OPENROUTER_API_KEY=your-openrouter-api-key
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## Run With Docker Compose

From the project root:

```bash
docker compose up --build
```

This starts:

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:8000](http://localhost:8000)
- Postgres: `localhost:5432`

The backend container runs `python init_db.py` on startup, so the database tables are created automatically.

## Test The Stack

1. Open [http://localhost:3000](http://localhost:3000)
2. Enter an idea title and description
3. Click `Generate`
4. Confirm a new idea is created, a version is generated, and the versions sidebar updates
5. Click `Refine` to create another version
6. Click `Delete` on a version card to remove it

You can also inspect the backend directly:

- `GET http://localhost:8000/ideas`
- `GET http://localhost:8000/ideas/{id}`
- `GET http://localhost:8000/ideas/{id}/versions`

## Local Non-Docker Development

Frontend:

```bash
npm install
npm run dev
```

Backend:

```bash
cd backend
pip install -r requirements.txt
python init_db.py
uvicorn main:app --reload --port 8000
```
