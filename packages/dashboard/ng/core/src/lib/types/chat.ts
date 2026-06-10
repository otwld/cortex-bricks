import { Message } from './message';

/**
 * Chat thread summary used by dashboard demo chat surfaces.
 */
export interface Chat {
  userId: number;
  name: string;
  photoUrl?: string;
  messages: Message[];
  status: string;
}
