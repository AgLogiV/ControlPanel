#!/bin/bash

# Control Panel Deployment Script
# This script helps deploy the Control Panel application

# Exit on error
set -e

# Display help message
function show_help {
  echo "Control Panel Deployment Script"
  echo "Usage: ./deploy.sh [options]"
  echo ""
  echo "Options:"
  echo "  -h, --help                 Show this help message"
  echo "  -e, --environment ENV      Set deployment environment (development, staging, production)"
  echo "  -d, --docker               Deploy using Docker"
  echo "  -b, --build-only           Only build the application, don't deploy"
  echo "  --client-only              Only deploy the client"
  echo "  --server-only              Only deploy the server"
  echo ""
}

# Default values
ENVIRONMENT="development"
USE_DOCKER=false
BUILD_ONLY=false
CLIENT_ONLY=false
SERVER_ONLY=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      show_help
      exit 0
      ;;
    -e|--environment)
      ENVIRONMENT="$2"
      shift 2
      ;;
    -d|--docker)
      USE_DOCKER=true
      shift
      ;;
    -b|--build-only)
      BUILD_ONLY=true
      shift
      ;;
    --client-only)
      CLIENT_ONLY=true
      shift
      ;;
    --server-only)
      SERVER_ONLY=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

echo "🚀 Starting deployment process for Control Panel..."
echo "Environment: $ENVIRONMENT"

# Create .env files if they don't exist
if [ ! -f "./server/.env" ]; then
  echo "Creating server .env file from example..."
  cp ./server/.env.example ./server/.env
fi

if [ ! -f "./client/.env" ]; then
  echo "Creating client .env file from example..."
  cp ./client/.env.example ./client/.env
fi

# Docker deployment
if [ "$USE_DOCKER" = true ]; then
  echo "🐳 Deploying with Docker..."
  
  # Build and start containers
  docker-compose -f docker-compose.yml up -d --build
  
  echo "✅ Docker deployment complete!"
  echo "📊 Client: http://localhost"
  echo "🔌 API: http://localhost:5000"
  exit 0
fi

# Build and deploy client
if [ "$SERVER_ONLY" = false ]; then
  echo "🔨 Building client..."
  cd client
  npm install
  npm run build
  
  if [ "$BUILD_ONLY" = false ]; then
    echo "📦 Deploying client..."
    
    # Example deployment steps for different environments
    case $ENVIRONMENT in
      production)
        echo "Deploying to production server..."
        # Add your production deployment commands here
        # Example: rsync -avz dist/ user@production-server:/var/www/html/
        ;;
      staging)
        echo "Deploying to staging server..."
        # Add your staging deployment commands here
        ;;
      development)
        echo "Local development deployment..."
        # For local development, just build is usually enough
        ;;
    esac
  fi
  
  cd ..
fi

# Build and deploy server
if [ "$CLIENT_ONLY" = false ]; then
  echo "🔨 Building server..."
  cd server
  npm install
  
  if [ "$BUILD_ONLY" = false ]; then
    echo "📦 Deploying server..."
    
    # Example deployment steps for different environments
    case $ENVIRONMENT in
      production)
        echo "Deploying to production server..."
        # Add your production deployment commands here
        # Example: rsync -avz ./ user@production-server:/opt/control-panel/server/
        # Example: ssh user@production-server "cd /opt/control-panel/server && pm2 restart index.js"
        ;;
      staging)
        echo "Deploying to staging server..."
        # Add your staging deployment commands here
        ;;
      development)
        echo "Starting development server..."
        npm run dev
        ;;
    esac
  fi
  
  cd ..
fi

echo "✅ Deployment process completed!" 