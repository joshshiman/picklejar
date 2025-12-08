#!/bin/bash

# PickleJar Startup Script
# This script starts both the backend and frontend servers

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "🥒 ======================================"
echo "   PickleJar Development Environment"
echo "======================================${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command_exists python3; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites installed${NC}"
echo ""

# Check if virtual environment exists
if [ ! -d "backend/.venv" ]; then
    echo -e "${YELLOW}⚠️  Virtual environment not found. Creating...${NC}"
    cd backend
    python3 -m venv .venv
    echo -e "${GREEN}✅ Virtual environment created${NC}"
    cd ..
fi

# Check if backend dependencies are installed
if [ ! -f "backend/.venv/bin/uvicorn" ] && [ ! -f "backend/.venv/Scripts/uvicorn.exe" ]; then
    echo -e "${YELLOW}⚠️  Backend dependencies not installed. Installing...${NC}"
    cd backend
    source .venv/bin/activate 2>/dev/null || source .venv/Scripts/activate 2>/dev/null
    pip install -r requirements.txt
    deactivate
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
    cd ..
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Frontend dependencies not found. Installing...${NC}"
    cd frontend
    npm install
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
    cd ..
fi

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  Backend .env not found. Copying from .env.example...${NC}"
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✅ Backend .env created${NC}"
fi

if [ ! -f "frontend/.env.local" ]; then
    echo -e "${YELLOW}⚠️  Frontend .env.local not found. Copying from .env.example...${NC}"
    cp frontend/.env.example frontend/.env.local
    echo -e "${GREEN}✅ Frontend .env.local created${NC}"
fi

echo ""
echo -e "${GREEN}🚀 Starting PickleJar...${NC}"
echo ""
echo -e "${BLUE}Backend will be available at:${NC} http://localhost:8000"
echo -e "${BLUE}API Docs will be available at:${NC} http://localhost:8000/docs"
echo -e "${BLUE}Frontend will be available at:${NC} http://localhost:3000"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down servers...${NC}"
    kill 0
    exit
}

trap cleanup SIGINT SIGTERM

# Start backend
echo -e "${BLUE}Starting backend...${NC}"
cd backend
source .venv/bin/activate 2>/dev/null || source .venv/Scripts/activate 2>/dev/null
uvicorn main:app --reload --log-level info &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 2

# Start frontend
echo -e "${BLUE}Starting frontend...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for both processes
wait
