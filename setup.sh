#!/bin/bash

echo ""
echo "========================================"
echo "  Dad's Medical Tracker - Setup"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install from: https://nodejs.org/"
    exit 1
fi

echo "[1] Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install backend dependencies"
    exit 1
fi
cd ..

echo ""
echo "[2] Creating .env file..."
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo ".env file created. Edit it if needed."
else
    echo ".env file already exists"
fi

echo ""
echo "========================================"
echo "   Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Make sure MongoDB is running"
echo "   - If local: Run 'mongod' in another terminal"
echo "   - If cloud: Ensure MongoDB Atlas cluster is active"
echo ""
echo "2. Start the backend:"
echo "   cd backend"
echo "   npm start"
echo ""
echo "3. Open the app in your browser:"
echo "   Open: d:/dad/frontend/index.html"
echo ""
echo "See QUICKSTART.md for more details"
echo ""
