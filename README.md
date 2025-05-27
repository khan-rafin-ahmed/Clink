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
    VITE_SUPABASE_URL=YOUR_LOCAL_SUPABASE_URL
    VITE_SUPABASE_ANON_KEY=YOUR_LOCAL_SUPABASE_ANON_KEY
    VITE_GOOGLE_OAUTH_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID # Required for Google OAuth, if configured
    ```
    Replace the placeholder values with the URLs and keys provided by `supabase start`. Google OAuth is optional if you are not using it.

## Running Locally

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
