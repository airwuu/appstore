#!/bin/bash

# Build the Docker image
echo "Building Docker image..."
docker build -t appstore-backend .

# Run the Docker container
# -it: Interactive mode
# --rm: Remove container after exit
# -p 5000:5000: Map port 5000
# -v $(pwd):/app: Mount current directory for live reloads (optional/helpful for dev)
echo "Starting Flask API in Docker..."
docker run -it --rm -p 5000:5000 -v "$(pwd):/app" appstore-backend
