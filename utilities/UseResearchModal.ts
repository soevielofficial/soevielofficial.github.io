import { useState } from "react";
import { INTERESTING_STUFF } from "@/utilities/InterestingStuff";

export function UseResearchModal() {
  const [selectedResearch, setSelectedResearch] = useState<number | null>(null);

  const openResearchModal = (index: number) => {
    setSelectedResearch(index);
  };

  const closeResearchModal = () => {
    setSelectedResearch(null);
  };

  return {
    selectedResearch,
    openResearchModal,
    closeResearchModal,
    researchItems: INTERESTING_STUFF
  };
}