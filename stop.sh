#!/bin/bash
# Milk Bank Tracker - Stop Script for macOS
# This script stops both the backend and frontend servers

echo "🛑 Stopping Milk Bank Tracker..."

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Stop Backend
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "   Stopping backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null || true
        rm .backend.pid
    else
        echo "   Backend already stopped"
        rm .backend.pid
    fi
else
    echo "   No backend PID file found"
fi

# Stop Frontend
if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "   Stopping frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null || true
        rm .frontend.pid
    else
        echo "   Frontend already stopped"
        rm .frontend.pid
    fi
else
    echo "   No frontend PID file found"
fi

# Also kill any remaining uvicorn or vite processes
pkill -f "uvicorn src.app.main" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

echo ""
echo "✅ Milk Bank Tracker stopped"
