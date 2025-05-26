# 🚀 Local Supabase Setup for Clink App

## Quick Start (Recommended)

### Step 1: Install Supabase CLI

**Option A: Direct Download (Recommended)**
```bash
# Download and install Supabase CLI
curl -L https://github.com/supabase/cli/releases/latest/download/supabase_darwin_arm64.tar.gz -o ~/Downloads/supabase.tar.gz
cd ~/Downloads
tar -xzf supabase.tar.gz
sudo mv supabase /usr/local/bin/
```

**Option B: Using Homebrew (if you have developer tools)**
```bash
brew install supabase/tap/supabase
```

### Step 2: Verify Installation
```bash
supabase --version
```

### Step 3: Run Setup Script
```bash
# In your Clink project directory
./setup-supabase.sh
```

## Manual Setup

If the script doesn't work, follow these steps:

### 1. Initialize Supabase
```bash
supabase init
```

### 2. Start Local Supabase
```bash
supabase start
```

### 3. Get Credentials
```bash
supabase status
```

### 4. Update Environment Variables
Copy the output from `supabase status` and update your `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_anon_key_from_supabase_status
```

## Alternative: Docker Setup

If CLI installation fails, use Docker:

### 1. Start with Docker Compose
```bash
docker-compose up -d
```

### 2. Run Migrations Manually
```bash
# Connect to the database and run your migrations
docker exec -i clink_db_1 psql -U postgres -d postgres < supabase/migrations/20240325_initial_schema.sql
# Repeat for other migration files
```

## Accessing Your Local Supabase

- **Database**: `postgresql://postgres:postgres@localhost:54322/postgres`
- **API**: `http://localhost:54321`
- **Studio**: `http://localhost:54323`

## Troubleshooting

### CLI Installation Issues
- Make sure you have Xcode Command Line Tools: `xcode-select --install`
- Try the Docker approach if CLI fails

### Permission Issues
- Use `sudo` for installation commands
- Check that `/usr/local/bin` is in your PATH

### Database Connection Issues
- Make sure Docker is running
- Check that ports 54321, 54322, 54323 are not in use
- Restart Supabase: `supabase stop && supabase start`

## Next Steps

1. ✅ Install Supabase CLI
2. ✅ Start local Supabase
3. ✅ Update environment variables
4. ✅ Test your Clink app at http://localhost:5174
5. ✅ Access Supabase Studio at http://localhost:54323

## Useful Commands

```bash
# Start Supabase
supabase start

# Stop Supabase
supabase stop

# Check status
supabase status

# Reset database
supabase db reset

# Generate types
supabase gen types typescript --local > src/types/supabase.ts
```
