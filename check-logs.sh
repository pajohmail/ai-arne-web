#!/bin/bash
# Script för att kolla loggar från generalNewsHandler

echo "🔍 Checking logs for generalNewsHandler..."
echo ""

# Kolla senaste 10 minuterna
gcloud logging read "resource.type=cloud_function AND resource.labels.function_name=generalNewsHandler AND timestamp>=\"$(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%SZ)\"" \
  --limit=200 \
  --format="value(timestamp,textPayload)" \
  --project=ai-arne-agents 2>&1 | grep -v "^$" | head -100

echo ""
echo "✅ Done"


