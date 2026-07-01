export type Role = 'athlete' | 'coach';

// Supported sports. Running is the primary/active sport; the rest are
// architecturally supported but hidden ("coming soon") for now.
export type Sport = 'running' | 'cycling' | 'triathlon' | 'athletics';

export interface SportOption {
  id: Sport;
  label: string;
  enabled: boolean;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar?: string;
}

export interface Workout {
  id: string;
  title: string;
  distance: string;
  duration: string;
  type: 'Easy' | 'Tempo' | 'Intervals' | 'Long Run' | 'Recovery';
  completed: boolean;
  date: string;
  description?: string;
  approved?: boolean;
}

export interface NutritionMeal {
  name: string;
  description: string;
  calories: string;
}

export interface Coach {
  id: string;
  name: string;
  specialty: string;
  specializations: string[];
  experience: string;
  athletesCount: number;
  rating: number;
  avatar: string;
  bio: string;
  sport: Sport;
  region: string;
  pricePerMonth: number;
}

export interface PlayerStatus {
  id: string;
  name: string;
  status: 'on_track' | 'needs_review' | 'at_risk';
  lastActivity: string;
  avatar: string;
  weeklyDistance: string;
  restingHR: number;
  recentPace: string;
  trainingLoad: number;
  goal: string;
  workouts: Workout[];
  sport?: Sport;
  nutrition?: NutritionMeal[];
}

export interface CommunityMember {
  name: string;
  avatar: string;
}

export interface Community {
  id: string;
  name: string;
  location: string;
  members: number;
  nextRun: string;
  imageUrl: string;
  joined?: boolean;
  memberList?: CommunityMember[];
}

export interface CommunityEvent {
  id: string;
  communityId: string;
  title: string;
  date: string;
  distance: string;
  location: string;
  createdBy: string;
  attendees: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'athlete' | 'coach';
  text: string;
  time: string;
}
