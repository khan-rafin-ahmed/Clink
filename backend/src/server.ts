import express from 'express';
import cors from 'cors';
import { Event, CreateEventDto, RsvpDto } from '../../shared/types';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (replace with a database in production)
const events: Event[] = [];

// Simple in-memory cache for public events
let cachedEvents: { data: Event[]; expiry: number } | null = null;

// Helper to load events - replace with database query in production
const loadPublicEvents = async (): Promise<Event[]> => {
  // In this demo the events array acts as our database
  return events;
};

// Routes
app.post('/events', (req, res) => {
  const eventData: CreateEventDto = req.body;
  const newEvent: Event = {
    id: Math.random().toString(36).substr(2, 9),
    ...eventData,
    attendees: [],
  };
  events.push(newEvent);
  res.status(201).json(newEvent);
});

// Cached public events route
app.get('/public-events', async (_req, res) => {
  const now = Date.now();

  if (cachedEvents && cachedEvents.expiry > now) {
    return res.json(cachedEvents.data);
  }

  const data = await loadPublicEvents();
  cachedEvents = {
    data,
    expiry: now + 60_000, // cache for 60 seconds
  };

  res.json(data);
});

app.get('/events/:id', (req, res) => {
  const event = events.find(e => e.id === req.params.id);
  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }
  res.json(event);
});

app.post('/events/:id/rsvp', (req, res) => {
  const { userId } = req.body as RsvpDto;
  const event = events.find(e => e.id === req.params.id);
  
  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  if (event.attendees.includes(userId)) {
    return res.status(400).json({ message: 'Already RSVPed' });
  }

  event.attendees.push(userId);
  res.json(event);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 