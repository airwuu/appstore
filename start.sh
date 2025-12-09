#!/usr/bin/env bash

# Kill all child processes on exit
trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT

# Build the Docker image
echo "Building Docker image..."
docker build -t appstore-backend .

# Run the Docker container in the background
echo "Starting Flask API in Docker..."
docker run --rm -p 5000:5000 -v "$(pwd):/app" appstore-backend &

# Move to frontend directory
cd web-app-store

# Install dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Start the frontend
echo "Starting Next.js Frontend..."
npm run dev
