import { useEffect, useState } from "react";
import { fetchServerData, ServerData } from "@/utilities/ServerData";

export function UseServerData() {
  const [serverData, setServerData] = useState<ServerData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServerInfo = async () => {
      try {
        const data = await fetchServerData();
        setServerData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load server data');
      } finally {
        setLoading(false);
      }
    };

    fetchServerInfo();
  }, []);

  return { serverData, loading, error };
}