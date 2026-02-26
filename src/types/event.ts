export interface Event {
  id: string;
  name: string;
  description?: string;
  eventDate?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventWithCount extends Event {
  participantCount: number;
}

export interface EventParticipant {
  requestId: string;
  displayName: string;
  email?: string;
  status: string;
  submittedAt: string;
  theme?: string;
}

export interface ParticipantEventHistory {
  eventId: string;
  eventName: string;
  eventDate?: string;
  requestId: string;
  status: string;
  submittedAt: string;
}
