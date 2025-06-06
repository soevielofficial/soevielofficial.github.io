import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaGithub, FaDiscord, FaEnvelope } from 'react-icons/fa';
import { fetchDiscordPresence } from '@/utilities/LanyardAPI';

interface SocialMediaLink {
  name: string;
  url: string;
  icon: React.ReactNode;
  status?: 'online' | 'idle' | 'dnd' | 'offline';
}

interface SocialMediaContainerProps {
  Github?: string;
  Discord?: string;
  EmailAddress?: string;
  IconSize?: number;
  className?: string;
  discordUserId?: string;
}

const SocialMediaContainer: React.FC<SocialMediaContainerProps> = ({
  Github = 'https://github.com/soevielofficial',
  Discord = 'https://discord.com/users/442224069899976707',
  EmailAddress = 'mailto:soevielofficial@gmail.com',
  IconSize = 32,
  className = '',
  discordUserId = '442224069899976707',
}) => {
  const [discordStatus, setDiscordStatus] = useState<'online' | 'idle' | 'dnd' | 'offline'>('offline');
  const [isLoading, setIsLoading] = useState(true);

  const statusColors = {
    online: 'bg-green-500',
    idle: 'bg-yellow-500',
    dnd: 'bg-red-500',
    offline: 'bg-gray-500',
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const presence = await fetchDiscordPresence(discordUserId);
        setDiscordStatus(presence.discord_status);
      } catch (error) {
        console.error('Failed to fetch Discord status:', error);
        setDiscordStatus('offline');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();

    // Set up WebSocket for real-time updates if needed
    const ws = new WebSocket('wss://api.lanyard.rest/socket');

    ws.onopen = () => {
      ws.send(JSON.stringify({
        op: 2,
        d: {
          subscribe_to_id: discordUserId,
        },
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.t === 'INIT_STATE' || data.t === 'PRESENCE_UPDATE') {
        setDiscordStatus(data.d.discord_status);
      }
    };

    return () => {
      ws.close();
    };
  }, [discordUserId]);

  const socialLinks: SocialMediaLink[] = [
    {
      name: 'GitHub',
      url: Github,
      icon: <FaGithub size={IconSize} />,
    },
    {
      name: 'Discord',
      url: Discord,
      icon: (
        <div className="relative">
          <FaDiscord size={IconSize} />
          {!isLoading && (
            <span
              className={`absolute -bottom-1 -right-1 w-3 h-3 ${
                statusColors[discordStatus]
              } rounded-full border-2 border-white dark:border-gray-900`}
            ></span>
          )}
        </div>
      ),
      status: discordStatus,
    },
    {
      name: 'Email',
      url: EmailAddress,
      icon: <FaEnvelope size={IconSize} />,
    },
  ];

  return (
    <div className={`flex space-x-4 ${className}`}>
      {socialLinks.map((link) => (
        <Link
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.name}
          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors duration-200 relative"
        >
          {link.icon}
        </Link>
      ))}
    </div>
  );
};

export default SocialMediaContainer;