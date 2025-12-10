from database import Base, engine
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import members, picklejars, suggestions, votes

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PickleJar API",
    description="API for democratic group hangout planning",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
from config import settings

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS + [
        "https://api.depickle.me",
        "https://depickle.me",
        "https://www.depickle.me",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(picklejars.router, prefix="/api/picklejars", tags=["PickleJars"])
app.include_router(suggestions.router, prefix="/api/suggestions", tags=["Suggestions"])
app.include_router(votes.router, prefix="/api/votes", tags=["Votes"])
app.include_router(members.router, prefix="/api/members", tags=["Members"])


@app.get("/")
async def root():
    return {"message": "Welcome to PickleJar API", "docs": "/docs", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
