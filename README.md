# Clink - Event Management Platform

A full-stack web application for managing and discovering events.

## Project Structure

```
clink/
├── frontend/          # React + Vite frontend
├── backend/           # Express + TypeScript backend
└── shared/           # Shared types and utilities
```

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

## Setup Instructions

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server

## API Endpoints

- `POST /events` - Create a new event
- `GET /events/:id` - Get event details
- `POST /events/:id/rsvp` - RSVP to an event

## Technologies Used

- Frontend:
  - React
  - TypeScript
  - Vite
  - Tailwind CSS
  - shadcn/ui
  - React Router

- Backend:
  - Node.js
  - Express
  - TypeScript
  - CORS 