# Clink

## Project Description

Clink is a web application designed to help users manage and RSVP to social "drinking sessions." It provides a platform for users to create events, view upcoming and past sessions, manage their attendance, and see who else is joining.

## Features

-   **User Authentication:** Secure sign-up and login using Supabase Auth.
-   **Session Management:** Create, view, and manage drinking sessions.
-   **RSVP System:** Users can mark themselves as "Going" to sessions.
-   **Live Attendee List:** See who is attending a session in real-time (via the RSVP feature).
-   **Session Details:** View details for each session, including date, time, location, and notes.
-   **Session Filtering:** Filter sessions by upcoming, past, or all.

## Technologies Used

-   **Frontend:** React
-   **Styling:** Tailwind CSS
-   **Backend & Database:** Supabase (Database, Authentication)
-   **Routing:** React Router
-   **UI Components:** Shadcn UI
-   **Icons:** Lucide React
-   **Toast Notifications:** Sonner
-   **Local Development:** Supabase CLI, Docker

## Prerequisites

Before you begin, ensure you have the following installed:

-   Node.js (v14 or later)
-   npm or Yarn
-   Docker Desktop (required for Supabase local development)
-   Supabase CLI

## Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/khan-rafin-ahmed/Clink.git
    cd Clink
    ```

2.  Navigate to the frontend directory:

    ```bash
    cd frontend
    ```

3.  Install frontend dependencies:

    ```bash
    npm install
    # or yarn install
    ```

## Supabase Setup (Local Development)

Clink uses Supabase for its backend. For local development, you can use the Supabase CLI.

1.  Navigate back to the project root directory:

    ```bash
    cd ..
    ```

2.  Ensure Docker Desktop is running.

3.  Start the Supabase local development environment:

    ```bash
    supabase start
    ```

    This will start the necessary Docker containers and provide you with local Supabase URLs and keys (including anon key and service role key). Keep these handy.

4.  Set up your database schema. Currently, the application expects an `events` table and an `rsvps` table. You will need to apply your migrations or manually create these tables based on your project's schema.
    *   The `rsvps` table structure we discussed is:
        ```sql
        create table rsvps (
          id uuid default uuid_generate_v4() primary key,
          event_id uuid references events(id) on delete cascade,
          user_id uuid references auth.users(id) on delete cascade,
          status text check (status in ('going', 'maybe', 'not_going')),
          created_at timestamp with time zone default timezone('utc'::text, now()),
          unique(event_id, user_id)
        );
        ```
    *   Ensure you have appropriate Row Level Security (RLS) policies configured for both `events` and `rsvps` tables to allow users to read events and manage their own RSVPs.

5.  Create a `.env.local` file in the `frontend` directory with your local Supabase credentials:

    ```env
    # Local Development Environment
    VITE_API_URL=http://localhost:3000
    VITE_SUPABASE_URL=http://localhost:54321
    VITE_SUPABASE_ANON_KEY=YOUR_LOCAL_ANON_KEY
    VITE_ENVIRONMENT=local

    # Mapbox & Google Maps - REPLACE WITH YOUR ACTUAL API KEYS
    VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1Ijoicm91Z2hpbiIsImEiOiJjbWJiMWh0a2YwdTVjMmtwcm5ubzI2MnpnIn0.zZ7-Pto8J7YiWZJzxf7kvQ
    VITE_MAPBOX_STYLE_URL=mapbox://styles/roughin/cmbb1ow4o001b01r0aux92662
    VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE
    ```

    **⚠️ IMPORTANT SECURITY NOTE:**
    - Replace `YOUR_LOCAL_ANON_KEY` with the anon key from `supabase status`
    - Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your actual Google Maps API key
    - **NEVER commit actual API keys to version control**
    - Keep your `.env.local` file in `.gitignore` (already configured)

## 🔐 Authentication Configuration

### Local Development Authentication

The app is configured to work seamlessly with localhost authentication:

- **Magic Links**: Automatically redirect to `http://localhost:3000/auth/callback`
- **Google OAuth**: Requires additional setup (see below)
- **Environment Detection**: Automatically detects local vs production environment

### Google OAuth Setup (Optional)

To enable Google OAuth in local development:

1. **Google Cloud Console**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to APIs & Services > Credentials
   - Edit your OAuth 2.0 Client ID
   - Add `http://localhost:3000/auth/callback` to Authorized redirect URIs

2. **Supabase Configuration**:
   - Open Supabase Studio: `http://localhost:54323`
   - Go to Authentication > Settings > Auth Providers
   - Enable Google provider with your OAuth credentials

3. **Test Authentication**:
   - Visit `http://localhost:3000/login`
   - Try both magic link and Google OAuth
   - Both should redirect properly to localhost

For detailed setup instructions, see `frontend/LOCAL_DEVELOPMENT_SETUP.md`.

## Running Locally

### 🚀 Quick Setup (Recommended)

Use our automated setup script for consistent local development:

```bash
./setup-local-dev.sh
```

This script will:
- ✅ Check prerequisites (Node.js, Docker, Supabase CLI)
- ✅ Initialize and start local Supabase
- ✅ Create `.env.local` with correct credentials
- ✅ Install dependencies
- ✅ Configure the app to run on `http://localhost:3000`

After setup completes:
```bash
cd frontend
npm run dev
```

### 📖 Manual Setup

If you prefer manual setup:

1.  Navigate to the `frontend` directory:

    ```bash
    cd frontend
    ```

2.  Start the development server:

    ```bash
    npm run dev
    # or yarn dev
    ```

    The application should open in your default browser, usually at `http://localhost:5173` (Vite's default port) or similar.

## Contributing

If you'd like to contribute, please fork the repository and create a pull request. Follow the commit message guidelines and ensure your code adheres to the project's coding standards.

## License

[Specify your project's license here, e.g., MIT, Apache 2.0, etc.]
