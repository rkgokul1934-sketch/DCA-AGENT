# pyrefly: ignore [missing-import]
from fastapi import FastAPI, Request, status
# pyrefly: ignore [missing-import]
from fastapi.responses import JSONResponse
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging
import time

from app.config import settings
from app.routes import auth, bookings, competition, agent, scheduling, sales_reps, analytics, enterprise, contacts
from app.routes import event_templates, availability
from app.models import event_template as _et_model  # ensure table is created

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    formatted_process_time = "{0:.2f}".format(process_time)
    logger.info(f"rid={request.method} {request.url.path} completed_in={formatted_process_time}ms status_code={response.status_code}")
    return response

# Exception Handling
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal Server Error", "message": str(exc)},
    )

# Routes
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(bookings.router, prefix=f"{settings.API_V1_STR}/legacy-bookings", tags=["Legacy Bookings"])
app.include_router(competition.router, prefix=settings.API_V1_STR, tags=["Competition Analysis"])
app.include_router(agent.router, prefix=f"{settings.API_V1_STR}/agent", tags=["AI Agent"])

# Enterprise GTM Routes (Phase 0.5)
app.include_router(scheduling.router, prefix=settings.API_V1_STR, tags=["Enterprise Scheduling"])
app.include_router(sales_reps.router, prefix=settings.API_V1_STR, tags=["Sales Management"])
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(enterprise.router, prefix="/api/v1")
app.include_router(contacts.router, prefix="/api/v1/contacts", tags=["Contacts Management"])
app.include_router(event_templates.router, prefix="/api/v1/event-templates", tags=["Event Templates"])
app.include_router(availability.router, prefix=settings.API_V1_STR, tags=["Availability Settings"])

import os

# Enterprise UI Mounting
if os.path.exists("frontend"):
    app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
else:
    @app.get("/")
    def read_root():
        return {"status": "ok", "message": f"{settings.PROJECT_NAME} Backend API is running successfully!"}
