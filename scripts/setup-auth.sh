#!/bin/bash

# Setup script for Google OAuth authentication
echo "Setting up Google OAuth authentication..."

# Check if running in Vercel environment
if [ -n "$VERCEL" ]; then
    echo "Running in Vercel environment"
    echo "Environment variables should be set in Vercel dashboard"
else
    echo "Setting up local environment variables..."
    
    # Create .env.local if it doesn't exist
    if [ ! -f .env.local ]; then
        touch .env.local
        echo "Created .env.local file"
    fi
    
    # Add Google OAuth credentials
    echo "# Google OAuth Configuration" >> .env.local
    echo "GOOGLE_CLIENT_ID=338253206434-pp4kk32qohilg76pbke4045uchvm13b9.apps.googleusercontent.com" >> .env.local
    echo "GOOGLE_CLIENT_SECRET=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" >> .env.local
    echo "NEXT_PUBLIC_BASE_URL=http://localhost:3000" >> .env.local
    
    echo "Environment variables added to .env.local"
fi

echo "Google OAuth setup complete!"
echo ""
echo "Next steps:"
echo "1. If deploying to Vercel, add these environment variables in your Vercel dashboard:"
echo "   - GOOGLE_CLIENT_ID=338253206434-pp4kk32qohilg76pbke4045uchvm13b9.apps.googleusercontent.com"
echo "   - GOOGLE_CLIENT_SECRET=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"
echo "   - NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app"
echo ""
echo "2. Make sure your Google OAuth app has the correct redirect URI:"
echo "   - For local: http://localhost:3000/api/auth/callback"
echo "   - For production: https://your-domain.vercel.app/api/auth/callback"
