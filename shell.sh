docker exec -it $(docker ps --filter "ancestor=appstore-backend" --format "{{.ID}}") /bin/bash
