export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  organizerId: string;
  attendees: string[];
}

export interface CreateEventDto {
  title: string;
  description: string;
  date: string;
  location: string;
  organizerId: string;
}

export interface RsvpDto {
  userId: string;
  eventId: string;
} 