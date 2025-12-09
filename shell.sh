#!/usr/bin/env bash
CONTAINER_ID=$(docker ps --filter ancestor=appstore-backend --format {{.ID}})

if [ -z "$CONTAINER_ID" ]; then
    echo "Error: No running container found with ancestor 'appstore-backend'."
    exit 1
else
    echo "Connecting to container $CONTAINER_ID..."
    docker exec -it "$CONTAINER_ID" /bin/bash
fi
