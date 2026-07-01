#!/bin/bash

# Deploy script for Control de Gastos on Railway

echo "🚀 Deploying Control de Gastos to Railway..."

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "📝 Checking Railway login..."
railway login || true

# Initialize or link to Railway project
echo "🔗 Linking to Railway project..."
cd backend
railway link --service="control-gastos-backend" || railway init
cd ..

cd frontend
railway link --service="control-gastos-frontend" || railway init
cd ..

# Deploy backend
echo "📦 Deploying backend..."
cd backend
railway up
railway domain
cd ..

# Get backend URL
BACKEND_URL=$(cd backend && railway domain --quiet | head -1)
echo "Backend URL: $BACKEND_URL"

# Update frontend env with backend URL
echo "🔧 Updating frontend API URL..."
sed -i.bak "s|REACT_APP_API_URL=.*|REACT_APP_API_URL=$BACKEND_URL|" frontend/.env.production

# Deploy frontend
echo "📦 Deploying frontend..."
cd frontend
railway up
railway domain
cd ..

echo ""
echo "✅ Deploy complete!"
echo ""
echo "🌐 URLs:"
echo "Backend: $BACKEND_URL"
echo "Frontend: $(cd frontend && railway domain --quiet | head -1)"
echo ""
echo "📚 Don't forget to set environment variables in Railway dashboard:"
echo "  - DATABASE_URL"
echo "  - SECRET_KEY"
echo "  - GOOGLE_OAUTH_CLIENT_ID"
echo "  - GOOGLE_OAUTH_CLIENT_SECRET"
echo "  - FRONTEND_URL"
