#!/bin/bash

# Start script for production deployment
# This ensures the Node.js server starts properly

echo "Starting SocialMonitor AI server..."

# Set NODE_ENV to production if not set
export NODE_ENV=${NODE_ENV:-production}

# Use the PORT environment variable or default to 5000
export PORT=${PORT:-5000}

echo "Environment: $NODE_ENV"
echo "Port: $PORT"

# Start the Node.js server
exec node dist/index.js