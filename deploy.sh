#!/bin/bash

echo "🚀 Starting deployment process..."

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ -f "dist/main.js" ]; then
    echo "✅ Build successful! dist/main.js exists"
else
    echo "❌ Build failed! dist/main.js not found"
    exit 1
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment completed!"
echo "🔗 Test your API at: https://your-app.vercel.app/"
echo "📚 API Documentation: https://your-app.vercel.app/api"
