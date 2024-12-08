export interface User {
  id: number;
  uid: string;
  username: string;
  email: string;
  avatar?: string;
  avatar_url?: string;
}

export interface Message {
  id: number;
  conversation: number;
  sender: User;
  content: string;
  created_at: string;
  status: 'sent' | 'delivered' | 'read';
  read_at: string | null;
}

export interface Conversation {
  id: number;
  participants: User[];
  other_participant: User;
  created_at: string;
  updated_at: string;
  last_message: Message | null;
  unread_count?: number;
} 