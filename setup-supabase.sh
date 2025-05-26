#!/bin/bash

echo "🚀 Setting up Local Supabase for Clink App"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   curl -L https://github.com/supabase/cli/releases/latest/download/supabase_darwin_arm64.tar.gz -o ~/Downloads/supabase.tar.gz"
    echo "   cd ~/Downloads && tar -xzf supabase.tar.gz && sudo mv supabase /usr/local/bin/"
    exit 1
fi

# Initialize Supabase (if not already initialized)
if [ ! -f "supabase/config.toml" ]; then
    echo "📝 Initializing Supabase..."
    supabase init
else
    echo "✅ Supabase already initialized"
fi

# Start Supabase
echo "🔄 Starting Supabase..."
supabase start

# Get the local URLs and keys
echo "📋 Getting Supabase credentials..."
supabase status

echo ""
echo "🎉 Supabase setup complete!"
echo ""
echo "📝 Update your frontend/.env file with these values:"
echo "   VITE_SUPABASE_URL=http://localhost:54321"
echo "   VITE_SUPABASE_ANON_KEY=[anon key from supabase status]"
echo ""
echo "🌐 Access Supabase Studio at: http://localhost:54323"
echo ""
echo "🔧 To stop Supabase later, run: supabase stop"
