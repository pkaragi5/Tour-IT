export interface Activity {
  name: string;
  description: string;
  location: string;
  coordinates: { lat: number; lng: number };
  cost: string;
  timeNeeded: string;
  distance?: string;
  travelTime?: string;
}

export interface TravelPlan {
  activities: Activity[];
  flow: string;
  whyFits: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
