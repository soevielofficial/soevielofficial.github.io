export interface RepoData {
  name: string;
  description: string;
  stars: number;
  forks: number;
  lastUpdated: string;
  url: string;
}

export async function getRepoData(owner: string, repo: string): Promise<RepoData> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      next: { revalidate: 3600 }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${owner}/${repo} data`);
    }
    
    const data = await response.json();
    
    return {
      name: data.name,
      description: data.description,
      stars: data.stargazers_count,
      forks: data.forks_count,
      lastUpdated: data.updated_at.split('T')[0],
      url: data.html_url
    };
  } catch (error) {
    console.error(`Error fetching GitHub repo data for ${owner}/${repo}:`, error);
    return {
      name: repo,
      description: `GitHub repository ${owner}/${repo}`,
      stars: 0,
      forks: 0,
      lastUpdated: new Date().toISOString().split('T')[0],
      url: `https://github.com/${owner}/${repo}`
    };
  }
}