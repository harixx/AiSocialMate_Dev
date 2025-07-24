#!/bin/bash

# SocialMonitor AI - Production Deployment Script
# This script ensures environment variables are properly set for production deployment

echo "🚀 Starting SocialMonitor AI production deployment..."

# Check if required environment variables are set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ ERROR: OPENAI_API_KEY environment variable is not set"
    echo "Please set it using one of these methods:"
    echo "1. In Replit: Add to App Secrets"
    echo "2. Export manually: export OPENAI_API_KEY=your-key-here"
    echo "3. In deployment platform: Add as environment variable"
    exit 1
fi

if [ -z "$SERPER_API_KEY" ]; then
    echo "❌ ERROR: SERPER_API_KEY environment variable is not set"
    echo "Please set it using one of these methods:"
    echo "1. In Replit: Add to App Secrets"
    echo "2. Export manually: export SERPER_API_KEY=your-key-here"
    echo "3. In deployment platform: Add as environment variable"
    exit 1
fi

echo "✅ Environment variables validated"
echo "   - OPENAI_API_KEY: ${OPENAI_API_KEY:0:8}..."
echo "   - SERPER_API_KEY: ${SERPER_API_KEY:0:8}..."

# Set production environment
export NODE_ENV=production
export PORT=${PORT:-5000}
export HOST=${HOST:-0.0.0.0}

echo "✅ Production environment configured"

# Build the application
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "🔨 Running custom build script..."
node build.js

if [ $? -ne 0 ]; then
    echo "❌ Custom build script failed"
    exit 1
fi

echo "✅ Build completed successfully"

# Start the production server
echo "🚀 Starting production server..."
node dist/index.js