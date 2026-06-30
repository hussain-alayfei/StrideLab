export type Role = 'athlete' | 'coach';

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

export interface Coach {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  athletesCount: number;
  rating: number;
  avatar: string;
  bio: string;
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
}

export interface Community {
  id: string;
  name: string;
  location: string;
  members: number;
  nextRun: string;
  imageUrl: string;
  joined?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'athlete' | 'coach';
  text: string;
  time: string;
}
