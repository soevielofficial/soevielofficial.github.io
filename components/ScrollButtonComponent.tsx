"use client";

import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

interface ScrollButtonProps {
  targetId: string;
  direction?: "down" | "up";
}

export default function ScrollButton({
  targetId,
  direction = "down",
}: ScrollButtonProps) {
  const scrollTo = () => {
    const targetSection = document.getElementById(targetId);
    targetSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <button
      onClick={scrollTo}
      className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 p-2"
      aria-label={
        direction === "down" ? "Scroll to next section" : "Scroll to top"
      }
    >
      {direction === "up" ? (
        <ChevronUpIcon
          className="h-8 w-8 text-white bg-black/30 rounded-full p-1 animate-bounce"
        />
      ) : (
        <ChevronDownIcon
          className="h-8 w-8 text-white bg-black/30 rounded-full p-1 animate-bounce"
        />
      )}
    </button>
  );
}