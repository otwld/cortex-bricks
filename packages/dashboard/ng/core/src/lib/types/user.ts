import { Message } from './message';

/**
 * Chat user summary used by dashboard chat demos.
 */
export interface User {
  id: number;
  name: string;
  image: string;
  status: string;
  messages: Message[];
  lastSeen: string;
}
