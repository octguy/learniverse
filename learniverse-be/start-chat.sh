#!/bin/bash

# Chat Module Quick Start Script
# This script helps you start Redis and the application

echo "🚀 Learniverse Chat Module - Quick Start"
echo "========================================"
echo ""

# Check if Redis is installed
if ! command -v redis-cli &> /dev/null; then
    echo "❌ Redis is not installed!"
    echo "Please install Redis first:"
    echo "  brew install redis"
    exit 1
fi

# Check if Redis is running
if redis-cli ping &> /dev/null; then
    echo "✅ Redis is already running"
else
    echo "🔄 Starting Redis..."
    brew services start redis
    sleep 2
    
    if redis-cli ping &> /dev/null; then
        echo "✅ Redis started successfully"
    else
        echo "❌ Failed to start Redis"
        exit 1
    fi
fi

echo ""
echo "📦 Building the application..."
./gradlew clean build -x test

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
    echo ""
    echo "🎯 Starting the application..."
    echo ""
    ./gradlew bootRun
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi
