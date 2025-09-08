"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FaGithub, FaDiscord, FaEnvelope } from 'react-icons/fa';

interface ProfileCardProps {
  className?: string;
}

interface DiscordStatus {
  status: "online" | "idle" | "dnd" | "offline" | "unknown";
}

export default function ProfileCard({ className = "" }: ProfileCardProps) {
  const [discordStatus, setDiscordStatus] = useState<DiscordStatus>({ status: "offline" });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState("");
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const twelveHour = hours % 12 || 12;

      setCurrentTime(`${twelveHour}:${minutes} ${ampm}`);
    };

    updateTime();
    const timeInterval = setInterval(updateTime, 60000);

    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    const fetchDiscordStatus = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://api.lanyard.rest/v1/users/442224069899976707`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setDiscordStatus({
              status: data.data.discord_status,
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch Discord status:", error);
        setDiscordStatus({ status: "unknown" });
      } finally {
        setLoading(false);
      }
    };

    fetchDiscordStatus();
    const ws = new WebSocket('wss://api.lanyard.rest/socket');

    ws.onopen = () => {
      ws.send(JSON.stringify({
        op: 2,
        d: {
          subscribe_to_id: '442224069899976707',
        },
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.t === 'INIT_STATE' || data.t === 'PRESENCE_UPDATE') {
        setDiscordStatus({ status: data.d.discord_status });
        setLoading(false);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const getStatusColor = () => {
    if (loading) return "bg-transparent border-2 border-gray-400 animate-pulse";

    switch (discordStatus.status) {
      case "online":
        return "bg-green-500";
      case "idle":
        return "bg-yellow-500";
      case "dnd":
        return "bg-red-500";
      case "offline":
        return "bg-gray-500";
      case "unknown":
      default:
        return "bg-gray-400";
    }
  };

  const getStatusText = () => {
    if (loading) return "Loading status...";

    switch (discordStatus.status) {
      case "online":
        return "Online";
      case "idle":
        return "Idle";
      case "dnd":
        return "Do Not Disturb";
      case "offline":
        return "Offline";
      case "unknown":
      default:
        return "Unknown";
    }
  };

  return (
    <div className={`relative w-fit max-w-full rounded-xl bg-black/75 backdrop-blur-md transition-all duration-500 hover:bg-black/80 hover:backdrop-blur-lg flex flex-col items-center text-center p-6 ${className}`}>
      <div className="absolute top-3 left-3 flex items-center">
        <svg className="w-4 h-4 text-gray-300 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs text-gray-300 font-medium">{currentTime}</span>
      </div>
      <Image unoptimized src="/profile.gif" alt="Profile" width={96} height={96} className="mb-6 rounded-full" />
      <h1 className="text-2xl md:text-3xl font-bold mb-3 text-white">Hi, i'm soevielofficial.</h1>
      <p className="text-sm md:text-base mb-6 text-gray-300 max-w-md">Here you can find information about my projects, interesting stuff from what i found and more.</p>
      <div className="flex space-x-5 mt-2">
        <a
          href="https://discord.com/users/442224069899976707"
          target="_blank"
          rel="noopener noreferrer"
          className="relative group transition-transform duration-300 hover:scale-110"
          onMouseEnter={() => setHoveredIcon("discord")}
          onMouseLeave={() => setHoveredIcon(null)}
        >
          <div className="w-10 h-10 flex items-center justify-center bg-[#5865F2] rounded-full">
            <FaDiscord className="w-5 h-5 text-white" />
          </div>
          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${getStatusColor()} rounded-full border-2 border-gray-900`}></div>
          <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap">
            {getStatusText()}
          </span>
        </a>
        <a
          href="https://github.com/soevielofficial"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-transform duration-300 hover:scale-110"
          onMouseEnter={() => setHoveredIcon("github")}
          onMouseLeave={() => setHoveredIcon(null)}
        >
          <div className="w-10 h-10 flex items-center justify-center bg-black rounded-full">
            <FaGithub className="w-5 h-5 text-white" />
          </div>
        </a>
        <a
          href="mailto:soevielofficial@gmail.com"
          className="transition-transform duration-300 hover:scale-110"
          onMouseEnter={() => setHoveredIcon("email")}
          onMouseLeave={() => setHoveredIcon(null)}
        >
          <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-[#EA4335] to-[#D14836] rounded-full">
            <FaEnvelope className="w-5 h-5 text-white" />
          </div>
        </a>
      </div>
    </div>
  );
}