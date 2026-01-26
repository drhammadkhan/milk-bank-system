#!/bin/bash
# Milk Bank Tracker - Startup Script for Linux
# This script starts both the backend and frontend servers

set -e  # Exit on error

echo "🥛 Starting Milk Bank Tracker..."
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "❌ Python virtual environment not found!"
    echo "Please run: python3 -m venv .venv && .venv/bin/pip install -r requirements.txt"
    exit 1
fi

# Check if node_modules exists in frontend
if [ ! -d "frontend/node_modules" ]; then
    echo "❌ Frontend dependencies not installed!"
    echo "Please run: cd frontend && npm install"
    exit 1
fi

# Create logs directory
mkdir -p logs

# Start Backend
echo "🚀 Starting backend server on http://localhost:8000..."
DATABASE_URL="sqlite:///./data/milkbank.db" .venv/bin/uvicorn src.app.main:app --host 0.0.0.0 --port 8000 --reload > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"
echo "$BACKEND_PID" > .backend.pid

# Wait a moment for backend to start
sleep 2

# Start Frontend
echo "🎨 Starting frontend server on http://localhost:3000..."
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo "   Frontend PID: $FRONTEND_PID"
echo "$FRONTEND_PID" > .frontend.pid

echo ""
echo "✅ Milk Bank Tracker is running!"
echo ""
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:3000"
echo ""
echo "   Backend logs:  tail -f logs/backend.log"
echo "   Frontend logs: tail -f logs/frontend.log"
echo ""
echo "To stop the application, run: ./stop-linux.sh"
echo ""
