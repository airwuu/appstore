# Use Python 3.11 slim image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
# bash is usually included, but we ensure sqlite3 is installed
RUN apt-get update && apt-get install -y \
    bash \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir pandas flask SQLAlchemy

# Copy the current directory contents into the container at /app
COPY . .

# Default command to run when starting the container
CMD ["bash"]
