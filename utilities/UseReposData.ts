import { useEffect, useState } from "react";
import { getRepoData, RepoData } from "@/utilities/RepoData";

const REPOSITORIES = [
  { owner: 'soevielofficial', repo: 'tof-vortex-extension' },
  { owner: 'soevielofficial', repo: 'tof-assets' },
  { owner: 'soevielofficial', repo: 'nte-assets' },
  { owner: 'soevielofficial', repo: 'wuwa-assets' },
];

export function UseReposData() {
  const [reposData, setReposData] = useState<Record<string, RepoData | null>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentRepoIndex, setCurrentRepoIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentRepoIndex(prev => (prev + 1) % REPOSITORIES.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchAllRepos = async () => {
      try {
        const reposData: Record<string, RepoData | null> = {};
        
        await Promise.all(REPOSITORIES.map(async ({ owner, repo }) => {
          try {
            const data = await getRepoData(owner, repo);
            reposData[`${owner}/${repo}`] = data;
          } catch (err) {
            console.error(`Failed to fetch ${owner}/${repo}:`, err);
            reposData[`${owner}/${repo}`] = null;
          }
        }));

        setReposData(reposData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load repositories data');
      } finally {
        setLoading(false);
      }
    };

    fetchAllRepos();
    const reposInterval = setInterval(fetchAllRepos, 300000);

    return () => {
      clearInterval(reposInterval);
    };
  }, []);

  const currentRepoKey = `${REPOSITORIES[currentRepoIndex].owner}/${REPOSITORIES[currentRepoIndex].repo}`;
  const currentRepo = reposData[currentRepoKey];

  return { 
    reposData, 
    loading, 
    error, 
    currentRepo, 
    currentRepoIndex, 
    setCurrentRepoIndex,
    repositories: REPOSITORIES 
  };
}