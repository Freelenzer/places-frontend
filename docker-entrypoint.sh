#!/bin/sh
set -e

# Write runtime config so the app knows which mode it's in without a rebuild.
# Set PUBLIC_MODE=true in the container environment to serve the read-only public UI.
if [ "$PUBLIC_MODE" = "true" ]; then
  echo '{"publicMode":true}' > /app/dist/config.json
else
  echo '{"publicMode":false}' > /app/dist/config.json
fi

exec serve -s dist -l 3000
