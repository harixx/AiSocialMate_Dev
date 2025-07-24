#!/bin/bash

# Production Environment Setup for Replit Deployment
# This script exports environment variables for production deployment

echo "🔧 Setting up production environment..."

# Check if running in Replit environment
if [ -n "$REPL_ID" ]; then
    echo "✅ Detected Replit environment"
    
    # Export secrets from Replit App Secrets to environment
    if [ -n "$OPENAI_API_KEY" ]; then
        export OPENAI_API_KEY="$OPENAI_API_KEY"
        echo "✅ OPENAI_API_KEY exported"
    else
        echo "❌ OPENAI_API_KEY not found in App Secrets"
        echo "Please add it to Replit App Secrets"
        exit 1
    fi
    
    if [ -n "$SERPER_API_KEY" ]; then
        export SERPER_API_KEY="$SERPER_API_KEY"
        echo "✅ SERPER_API_KEY exported"
    else
        echo "❌ SERPER_API_KEY not found in App Secrets"
        echo "Please add it to Replit App Secrets"
        exit 1
    fi
    
    # Set production environment
    export NODE_ENV=production
    export PORT=5000
    export HOST=0.0.0.0
    
    echo "✅ Production environment configured"
    echo "Environment variables ready for deployment"
    
else
    echo "⚠️  Not running in Replit environment"
    echo "Make sure to set environment variables manually:"
    echo "- OPENAI_API_KEY"
    echo "- SERPER_API_KEY"
fi