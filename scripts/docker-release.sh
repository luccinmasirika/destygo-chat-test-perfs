#!/bin/bash

# Script personnalisé pour le tagging Docker avec semantic-release
set -e

# Vérifier que la version est fournie
if [ -z "$1" ]; then
    echo "❌ Version manquante. Usage: $0 <version>"
    exit 1
fi

VERSION=$1
echo "🏷️  Tagging Docker image avec la version: $VERSION"

# Vérifier les variables d'environnement
if [ -z "$DOCKERHUB_USERNAME" ] || [ -z "$DOCKERHUB_PASS" ]; then
    echo "❌ Variables d'environnement Docker Hub manquantes"
    echo "   DOCKERHUB_USERNAME et DOCKERHUB_PASS doivent être définies"
    exit 1
fi

# Login Docker Hub
echo "🔐 Login Docker Hub..."
echo "$DOCKERHUB_PASS" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin

# Build l'image Docker
echo "🔨 Building Docker image..."
docker buildx build --platform linux/amd64 \
    --build-arg VERSION=$VERSION \
    --build-arg COMMIT=${CIRCLE_SHA1:-$(git rev-parse HEAD)} \
    -t viasay/destygo-chat-performance-test:$VERSION \
    -t viasay/destygo-chat-performance-test:latest \
    --load .

# Push les images
echo "📤 Pushing Docker images..."
docker push viasay/destygo-chat-performance-test:$VERSION
docker push viasay/destygo-chat-performance-test:latest

echo "✅ Docker images taggées et poussées avec succès!"
echo "   - viasay/destygo-chat-performance-test:$VERSION"
echo "   - viasay/destygo-chat-performance-test:latest"