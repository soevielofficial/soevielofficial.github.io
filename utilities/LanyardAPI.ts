import axios from 'axios';

interface DiscordPresence {
  discord_user: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string;
  };
  discord_status: 'online' | 'idle' | 'dnd' | 'offline';
  activities: {
    id: string;
    name: string;
    type: number;
    url?: string;
    created_at: number;
    timestamps?: {
      start?: number;
      end?: number;
    };
    application_id?: string;
    details?: string;
    state?: string;
    emoji?: {
      name: string;
      id?: string;
      animated?: boolean;
    };
    party?: {
      id?: string;
      size?: [number, number];
    };
    assets?: {
      large_image?: string;
      large_text?: string;
      small_image?: string;
      small_text?: string;
    };
    secrets?: {
      join?: string;
      spectate?: string;
      match?: string;
    };
    instance?: boolean;
    flags?: number;
    buttons?: (string | { label: string; url: string })[];
  }[];
  active_on_discord_web: boolean;
  active_on_discord_mobile: boolean;
  active_on_discord_desktop: boolean;
}

export const fetchDiscordPresence = async (userId: string): Promise<DiscordPresence> => {
  try {
    const response = await axios.get(`https://api.lanyard.rest/v1/users/${userId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching Discord presence:', error);
    throw error;
  }
};