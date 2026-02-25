export type Role = 'worker' | 'employer';

export interface User {
  id: string;
  name: string;
  role: Role;
  lat?: number;
  lng?: number;
  lastActive?: string;
}

export interface Post {
  id: string;
  user_id: string;
  user_name?: string;
  title: string;
  description: string;
  category: string;
  lat: number;
  lng: number;
  created_at: string;
  distance?: number;
}
