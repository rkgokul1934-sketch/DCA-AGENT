# Demo Booking Platform Backend

A production-ready FastAPI backend for a Calendly-style demo booking platform with competition analysis.

## Features

- **Auth**: JWT-based authentication (Register/Login).
- **Bookings**: Create, list, get details, and cancel demo bookings.
- **Rescheduling**: Reschedule existing bookings with history tracking.
- **Competition Analysis**: Compare our platform against competitors.
- **Async**: Fully asynchronous DB operations using SQLAlchemy 2.0 and asyncpg.
- **Scalable**: Clean architecture with separate layers for routes, services, and repositories.

## Tech Stack

- **FastAPI**: Modern, fast web framework.
- **SQLAlchemy 2.0**: Async ORM.
- **PostgreSQL**: Robust relational database.
- **Alembic**: Database migrations.
- **Pydantic V2**: Data validation and settings management.
- **JWT**: Secure token-based authentication.

## Project Structure

```
app/
├── main.py            # Entry point
├── database.py        # DB connection & session
├── config.py          # Settings & Env vars
├── models/            # SQLAlchemy models
├── schemas/           # Pydantic schemas
├── routes/            # API endpoints
├── services/          # Business logic
├── repositories/      # Data access layer
├── utils/             # Helper functions
└── middleware/        # Custom middlewares
```

## Setup Instructions

### 1. Prerequisites
- Python 3.11+
- PostgreSQL

### 2. Installation
```bash
# Clone the repository (if applicable)
# Create a virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Variables
Copy `.env.example` to `.env` and update your database credentials:
```bash
cp .env.example .env
```

### 4. Database Migrations
```bash
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

### 5. Seed Data
```bash
python seed.py
```

### 6. Run the Application
```bash
uvicorn app.main:app --reload
```

## API Documentation
Once the server is running, visit:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## Business Rules
- **Double Booking**: The system prevents two bookings at the same time and date.
- **Past Dates**: Users cannot book demos for dates in the past.
- **Rescheduling**: Updating a booking automatically saves the old slot details in the reschedule history.
