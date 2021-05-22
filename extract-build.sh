#!/usr/bin/env bash
set -eEuo pipefail
echo 'Extracting build from Docker image...'
container_id=$(docker create gcr.io/$PROJECT_ID/coliver-access-web)
echo "debug: container_id=${container_id}"
docker cp ${container_id}:/work/build build
docker rm ${container_id}

