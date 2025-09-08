'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import debounce from 'lodash/debounce';
import { ok } from 'assert';
import { trim, values, filter, includes } from 'lodash';
import { json } from 'stream/consumers';

interface Account {
  crew_id: number;
  crew_name: string;
  gender: number;
  last_seen: number;
  name: string;
  registered: string;
  role_id: number;
  server_region: string;
}

interface AgeStatistics {
  totalAccounts: number;
  averageAge: number;
  medianAge: number;
  ageDistribution: Record<string, number>;
  oldestAccount: { account: Account; ageInDays: number };
  newestAccount: { account: Account; ageInDays: number };
}

interface DatabaseHistory {
  lastChecked: number;
  knownAccounts: Record<string, number>;
}

interface NewAccount {
  account: Account;
  firstSeen: number;
  region: string;
}

interface AccountAddition {
  role_id: number;
  server_region: string;
  added_timestamp: number;
  account_data: Account;
}

interface CrewInfo {
  name: string;
  size: number;
  region: string;
}

interface FullStatistics {
  gender: { male: number; female: number };
  yearly: Record<string, number>;
  crews: Record<string, {
    totalCrews: number;
    averageCrewSize: number;
    largestCrew: { name: string; size: number };
    topCrews: CrewInfo[];
  }>;
  totalAccounts: number;
  regions: number;
  age: AgeStatistics | null;
}

interface RegionData {
  accounts: Record<string, Account>;
}

interface RegionInfo {
  last_update: number;
  total_accounts: number;
}

interface IndexData {
  last_update: number;
  regions: Record<string, RegionInfo>;
  total_accounts: number;
}

interface ServerInfo {
  "IP Address": string;
  "Hostname": string;
  "ASN": string;
  "ISP": string;
  "Services"?: string;
  "Country": string;
  "State Region"?: string;
  "City": string;
  "Latitude": string;
  "Longitude": string;
}

interface RegionServerInfo {
  [serverName: string]: ServerInfo;
}

interface ServerData {
  os: {
    [regionName: string]: RegionServerInfo | ServerInfo;
  };
  cn?: {
    [serverName: string]: ServerInfo;
  };
}

export default function GameManagerDatabase() {
  const [ageStats, setAgeStats] = useState<AgeStatistics | null>(null);
  const [newAccounts, setNewAccounts] = useState<NewAccount[]>([]);
  const [isStatisticsModalOpen, setIsStatisticsModalOpen] = useState(false);
  const [fullStatistics, setFullStatistics] = useState<FullStatistics | null>(null);
  const [crewStats, setCrewStats] = useState<Record<string, { totalCrews: number; averageCrewSize: number; largestCrew: { name: string; size: number } }>>({});
  const [genderStats, setGenderStats] = useState<{ male: number; female: number }>({ male: 0, female: 0 });
  const [yearlyStats, setYearlyStats] = useState<Record<string, number>>({});
  const [instantSearchResults, setInstantSearchResults] = useState<Account[]>([]);
  const [isInstantSearching, setIsInstantSearching] = useState(false);
  const [activeRegion, setActiveRegion] = useState('asia_pacific');
  const [regionData, setRegionData] = useState<RegionData | null>(null);
  const [indexData, setIndexData] = useState<IndexData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingIndex, setIsLoadingIndex] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'asia_pacific': true,
    'europe': false,
    'north_america': false,
    'southeast_asia': false,
    'south_america': false,
    '에스페리아': false,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Account[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [yearFilter, setYearFilter] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [genderFilter, setGenderFilter] = useState<number[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const regions = ['asia_pacific', 'europe', 'north_america', 'southeast_asia', 'south_america', '에스페리아'];
  const [dateRangeFilter, setDateRangeFilter] = useState<{ start: string, end: string }>({ start: '', end: '' });
  const formatRegionName = (region: string) => {
    const regionMap: Record<string, string> = {
      'asia_pacific': 'Asia Pacific',
      'europe': 'Europe',
      'north_america': 'North America',
      'southeast_asia': 'Southeast Asia',
      'south_america': 'South America',
      "에스페리아": "Korea",
    };

    return regionMap[region] || region.replace('_', ' ');
  };
  const [serverData, setServerData] = useState<ServerData | null>(null);
  const [expandedServerRegions, setExpandedServerRegions] = useState<Record<string, boolean>>({});
  const [isLoadingServers, setIsLoadingServers] = useState(true);
  const serversUrl = 'https://raw.githubusercontent.com/Nan-Yin-s-Bedroom/tofgm-database/main/servers/servers.json';
  const indexUrl = 'https://raw.githubusercontent.com/Nan-Yin-s-Bedroom/tofgm-database/main/index.json';
  const regionUrls = {
    asia_pacific: 'https://raw.githubusercontent.com/Nan-Yin-s-Bedroom/tofgm-database/main/accounts/asia_pacific/accounts.json',
    europe: 'https://raw.githubusercontent.com/Nan-Yin-s-Bedroom/tofgm-database/main/accounts/europe/accounts.json',
    north_america: 'https://raw.githubusercontent.com/Nan-Yin-s-Bedroom/tofgm-database/main/accounts/north_america/accounts.json',
    southeast_asia: 'https://raw.githubusercontent.com/Nan-Yin-s-Bedroom/tofgm-database/main/accounts/southeast_asia/accounts.json',
    south_america: 'https://raw.githubusercontent.com/Nan-Yin-s-Bedroom/tofgm-database/main/accounts/south_america/accounts.json',
    에스페리아: 'https://raw.githubusercontent.com/nanyinsbedroom/tofgm-database/refs/heads/main/accounts/%C3%AC%E2%80%94%C2%90%C3%AC%C5%A0%C2%A4%C3%AD%C5%BD%CB%9C%C3%AB%C2%A6%C2%AC%C3%AC%E2%80%A2%E2%80%9E/accounts.json'
  };

  const calculateAccountAge = (registeredDate: string): number => {
    if (!registeredDate) return 0;

    const regDate = new Date(registeredDate);
    if (isNaN(regDate.getTime())) return 0;

    const today = new Date();
    const diffTime = Math.abs(today.getTime() - regDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Convert to days
  };

  const calculateAgeStatistics = useCallback((accounts: Account[]) => {
    const validAccounts = accounts.filter(acc => acc.registered && !isNaN(new Date(acc.registered).getTime()));

    if (validAccounts.length === 0) {
      return null;
    }

    const ages = validAccounts.map(acc => calculateAccountAge(acc.registered));
    const sortedAges = [...ages].sort((a, b) => a - b);
    const middle = Math.floor(sortedAges.length / 2);
    const medianAge = sortedAges.length % 2 === 0 ? (sortedAges[middle - 1] + sortedAges[middle]) / 2 : sortedAges[middle];
    const averageAge = ages.reduce((sum, age) => sum + age, 0) / ages.length;
    const ageDistribution: Record<string, number> = {};
    ages.forEach(ageInDays => {
      const ageInMonths = Math.floor(ageInDays / 30);
      const key = ageInMonths < 12 ? `${ageInMonths} month${ageInMonths !== 1 ? 's' : ''}` : `${Math.floor(ageInMonths / 12)} year${Math.floor(ageInMonths / 12) !== 1 ? 's' : ''}`;
      ageDistribution[key] = (ageDistribution[key] || 0) + 1;
    });

    let oldestAccount = { account: validAccounts[0], ageInDays: ages[0] };
    let newestAccount = { account: validAccounts[0], ageInDays: ages[0] };

    validAccounts.forEach((account, index) => {
      if (ages[index] > oldestAccount.ageInDays) {
        oldestAccount = { account, ageInDays: ages[index] };
      }
      if (ages[index] < newestAccount.ageInDays) {
        newestAccount = { account, ageInDays: ages[index] };
      }
    });

    return {
      totalAccounts: validAccounts.length,
      averageAge,
      medianAge,
      ageDistribution,
      oldestAccount,
      newestAccount
    };
  }, []);

  const debouncedInstantSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setInstantSearchResults([]);
        setIsInstantSearching(false);
        return;
      }

      setIsInstantSearching(true);
      try {
        const allAccounts: Account[] = [];
        for (const region of regions) {
          try {
            const response = await fetch(regionUrls[region as keyof typeof regionUrls]);
            if (response.ok) {
              const data: RegionData = await response.json();
              const accounts = Object.values(data.accounts);
              const filteredAccounts = accounts.filter(account =>
                account.name.toLowerCase().includes(query.toLowerCase()) ||
                account.crew_name.toLowerCase().includes(query.toLowerCase()) ||
                account.role_id.toString().includes(query)
              ).map(account => ({
                ...account,
                server_region: region
              }));
              allAccounts.push(...filteredAccounts);
            }
          } catch (err) {
            console.error(`Error fetching data for ${region}:`, err);
          }
        }
        setInstantSearchResults(allAccounts);
      } catch (err) {
        console.error('Instant search error:', err);
        setError('Failed to search accounts. Please try again.');
      } finally {
        setIsInstantSearching(false);
      }
    }, 300),
    []
  );

  const trackNewAccounts = useCallback(async (regionData: RegionData, region: string) => {
    try {
      const historyKey = 'tofgm_database_history';
      const storedHistory = localStorage.getItem(historyKey);
      const history: DatabaseHistory = storedHistory
        ? JSON.parse(storedHistory)
        : { lastChecked: 0, knownAccounts: {} };

      const currentTime = Date.now();
      const newAccountsList: NewAccount[] = [];
      const updatedKnownAccounts = { ...history.knownAccounts };
      Object.values(regionData.accounts).forEach(account => {
        const accountKey = `${region}:${account.role_id}`;

        if (!history.knownAccounts[accountKey]) {
          const newAccount: NewAccount = {
            account,
            firstSeen: currentTime,
            region
          };
          newAccountsList.push(newAccount);
          updatedKnownAccounts[accountKey] = currentTime;
        }
      });
      const updatedHistory: DatabaseHistory = {
        lastChecked: currentTime,
        knownAccounts: updatedKnownAccounts
      };
      localStorage.setItem(historyKey, JSON.stringify(updatedHistory));

      return newAccountsList;
    } catch (error) {
      console.error('Error tracking new accounts:', error);
      return [];
    }
  }, []);

  const loadRecentNewAccounts = useCallback(async () => {
    try {
      // Get new accounts from all regions
      const allNewAccounts: NewAccount[] = [];

      for (const region of regions) {
        try {
          const response = await fetch(regionUrls[region as keyof typeof regionUrls]);
          if (response.ok) {
            const data: RegionData = await response.json();
            const regionNewAccounts = await trackNewAccounts(data, region);
            allNewAccounts.push(...regionNewAccounts);
          }
        } catch (err) {
          console.error(`Error loading data for ${region}:`, err);
        }
      }

      // Filter to only show accounts added in the last 24 hours
      const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
      const recentNewAccounts = allNewAccounts.filter(
        account => account.firstSeen > twentyFourHoursAgo
      );

      // Sort by most recent first
      recentNewAccounts.sort((a, b) => b.firstSeen - a.firstSeen);

      setNewAccounts(recentNewAccounts);
    } catch (error) {
      console.error('Error loading recent new accounts:', error);
    }
  }, [trackNewAccounts]);

  const checkForNewAccounts = useCallback(async () => {
    setIsLoading(true);
    await loadRecentNewAccounts();
    setIsLoading(false);
  }, [loadRecentNewAccounts]);

  useEffect(() => {
    if (indexData) {
      loadRecentNewAccounts();
    }
  }, [indexData, loadRecentNewAccounts]);

  const clearTrackingHistory = useCallback(() => {
    if (confirm('Are you sure you want to clear the new accounts tracking history? This will reset all tracking data.')) {
      localStorage.removeItem('tofgm_database_history');
      setNewAccounts([]);
      alert('Tracking history cleared. The system will start tracking new accounts from now on.');
    }
  }, []);



  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim()) {
      setIsInstantSearching(true);
      debouncedInstantSearch(query);
    } else {
      setInstantSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const getServerRegionName = (folder: string): string => {
    const folderToServerMap: Record<string, string> = {
      'asia_pacific': 'Asia Pacific',
      'europe': 'Europe',
      'north_america': 'North America',
      'southeast_asia': 'Southeast Asia',
      'south_america': 'South America',
      '에스페리아': 'Korea'
    };

    return folderToServerMap[folder] || folder;
  };

  const getYearFromRegistered = (registered: string): string => {
    if (!registered) return 'Unknown';
    const date = new Date(registered);
    return isNaN(date.getTime()) ? 'Unknown' : date.getFullYear().toString();
  };

  const extractAvailableYears = (accounts: Account[]): string[] => {
    const years = new Set<string>();
    accounts.forEach(account => {
      const year = getYearFromRegistered(account.registered);
      if (year !== 'Unknown') {
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  };

  const handleSort = (order: 'asc' | 'desc') => {
    setSortOrder(order);
  };

  const clearSort = () => {
    setSortOrder(null);
  };

  const filterAccountsByDateRange = (accounts: Account[]): Account[] => {
    if (!dateRangeFilter.start && !dateRangeFilter.end) return accounts;

    const startDate = dateRangeFilter.start ? new Date(dateRangeFilter.start) : null;
    const endDate = dateRangeFilter.end ? new Date(dateRangeFilter.end) : null;

    const effectiveStartDate = startDate || new Date('2022-01-01');
    const effectiveEndDate = endDate || new Date('2032-12-31');

    return accounts.filter(account => {
      if (!account.registered) return false;

      const accountDate = new Date(account.registered);
      if (isNaN(accountDate.getTime())) return false;

      return accountDate >= effectiveStartDate && accountDate <= effectiveEndDate;
    });
  };

  const filterAccountsByYear = (accounts: Account[]): Account[] => {
    if (yearFilter.length === 0) return accounts;

    return accounts.filter(account => {
      const accountYear = getYearFromRegistered(account.registered);
      return yearFilter.includes(accountYear);
    });
  };

  const filterAccountsByGender = (accounts: Account[]): Account[] => {
    if (genderFilter.length === 0) return accounts;

    return accounts.filter(account => {
      return genderFilter.includes(account.gender);
    });
  };

  const applyAllFilters = (accounts: Account[]): Account[] => {
    let filtered = accounts;
    filtered = filterAccountsByYear(filtered);
    filtered = filterAccountsByGender(filtered);
    filtered = filterAccountsByDateRange(filtered);
    return filtered;
  };

  const handleDateRangeChange = (type: 'start' | 'end', value: string) => {
    setDateRangeFilter(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const clearDateRangeFilter = () => {
    setDateRangeFilter({ start: '', end: '' });
  };

  const fetchServerData = async () => {
    setIsLoadingServers(true);
    try {
      const response = await fetch(serversUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ServerData = await response.json();
      setServerData(data);

      const initialExpandedState: Record<string, boolean> = {};
      if (data.os) {
        Object.keys(data.os).forEach(region => {
          initialExpandedState[region] = false;
        });
      }
      setExpandedServerRegions(initialExpandedState);
    } catch (err) {
      console.error('Fetch servers error:', err);
    } finally {
      setIsLoadingServers(false);
    }
  };

  const calculateStatistics = async (indexData: IndexData) => {
    try {
      let maleCount = 0;
      let femaleCount = 0;
      const yearlyCounts: Record<string, number> = {};
      const regionCrewStats: Record<string, {
        totalCrews: number;
        averageCrewSize: number;
        largestCrew: { name: string; size: number };
        topCrews: CrewInfo[];
      }> = {};

      const allAccounts: Account[] = [];
      for (const region of regions) {
        try {
          const response = await fetch(regionUrls[region as keyof typeof regionUrls]);
          if (response.ok) {
            const data: RegionData = await response.json();
            allAccounts.push(...Object.values(data.accounts));
          }
        } catch (err) {
          console.error(`Error fetching data for ${region} for statistics:`, err);
        }
      }
      const ageStatistics = calculateAgeStatistics(allAccounts);
      setAgeStats(ageStatistics);
      regions.forEach(region => {
        regionCrewStats[region] = {
          totalCrews: 0,
          averageCrewSize: 0,
          largestCrew: { name: 'None', size: 0 },
          topCrews: []
        };
      });

      for (const region of regions) {
        try {
          const response = await fetch(regionUrls[region as keyof typeof regionUrls]);
          if (response.ok) {
            const data: RegionData = await response.json();
            const accounts = Object.values(data.accounts);
            accounts.forEach(account => {
              if (account.gender === 0) maleCount++;
              else if (account.gender === 1) femaleCount++;

              const year = getYearFromRegistered(account.registered);
              if (year !== 'Unknown') {
                yearlyCounts[year] = (yearlyCounts[year] || 0) + 1;
              }
            });

            const crewMembers: Record<string, number> = {};

            accounts.forEach(account => {
              if (account.crew_name && account.crew_name.trim() !== '') {
                crewMembers[account.crew_name] = (crewMembers[account.crew_name] || 0) + 1;
              }
            });

            const totalCrews = Object.keys(crewMembers).length;
            const totalCrewMembers = Object.values(crewMembers).reduce((sum, size) => sum + size, 0);
            const averageCrewSize = totalCrews > 0 ? totalCrewMembers / totalCrews : 0;

            let largestCrew = { name: 'None', size: 0 };
            const topCrews: CrewInfo[] = [];

            for (const [crewName, size] of Object.entries(crewMembers)) {
              if (size > largestCrew.size) {
                largestCrew = { name: crewName, size };
              }

              topCrews.push({ name: crewName, size, region });
            }

            topCrews.sort((a, b) => b.size - a.size).splice(5);

            regionCrewStats[region] = {
              totalCrews,
              averageCrewSize,
              largestCrew,
              topCrews
            };
          }
        } catch (err) {
          console.error(`Error fetching data for ${region} for statistics:`, err);
        }
      }

      setGenderStats({ male: maleCount, female: femaleCount });
      setYearlyStats(yearlyCounts);
      setCrewStats(regionCrewStats);
      setFullStatistics({
        gender: { male: maleCount, female: femaleCount },
        yearly: yearlyCounts,
        crews: regionCrewStats,
        totalAccounts: indexData.total_accounts,
        regions: regions.length,
        age: ageStatistics
      });
    } catch (err) {
      console.error('Error calculating statistics:', err);
    }
  };

  const fetchIndexData = async () => {
    setIsLoadingIndex(true);
    try {
      const response = await fetch(indexUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: IndexData = await response.json();
      setIndexData(data);

      calculateStatistics(data);
    } catch (err) {
      console.error('Fetch index error:', err);
      setError('Failed to load index data. Please check your internet connection and try again.');
    } finally {
      setIsLoadingIndex(false);
    }
  };

  const fetchRegionData = async (region: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(regionUrls[region as keyof typeof regionUrls]);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: RegionData = await response.json();
      setRegionData(data);

      const accounts = Object.values(data.accounts);
      const years = extractAvailableYears(accounts);
      setAvailableYears(years);

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load data. Please check your internet connection and try again.');
      setRegionData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const searchAccounts = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowSearchResults(true);
    setError(null);

    try {
      if (instantSearchResults.length > 0) {
        setSearchResults(instantSearchResults);
        const years = extractAvailableYears(instantSearchResults);
        setAvailableYears(years);
      } else {
        const allAccounts: Account[] = [];
        for (const region of regions) {
          try {
            const response = await fetch(regionUrls[region as keyof typeof regionUrls]);
            if (response.ok) {
              const data: RegionData = await response.json();
              const accounts = Object.values(data.accounts);
              const filteredAccounts = accounts.filter(account =>
                account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                account.crew_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                account.role_id.toString().includes(searchQuery)
              ).map(account => ({
                ...account,
                server_region: region
              }));
              allAccounts.push(...filteredAccounts);
            }
          } catch (err) {
            console.error(`Error fetching data for ${region}:`, err);
          }
        }
        const years = extractAvailableYears(allAccounts);
        setAvailableYears(years);
        setSearchResults(allAccounts);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search accounts. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setInstantSearchResults([]);
    setShowSearchResults(false);
    setYearFilter([]);
    setGenderFilter([]);
  };

  const handleYearFilterChange = (year: string) => {
    setYearFilter(prev =>
      prev.includes(year)
        ? prev.filter(y => y !== year)
        : [...prev, year]
    );
  };

  const handleGenderFilterChange = (gender: number) => {
    setGenderFilter(prev =>
      prev.includes(gender)
        ? prev.filter(g => g !== gender)
        : [...prev, gender]
    );
  };

  const clearYearFilter = () => {
    setYearFilter([]);
  };

  const clearGenderFilter = () => {
    setGenderFilter([]);
  };

  const clearAllFilters = () => {
    setYearFilter([]);
    setGenderFilter([]);
  };

  useEffect(() => {
    fetchServerData();
  }, []);

  useEffect(() => {
    fetchIndexData();
  }, []);

  useEffect(() => {
    if (isStatisticsModalOpen) {
      const scrollY = window.scrollY;

      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isStatisticsModalOpen]);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isStatisticsModalOpen) {
        setIsStatisticsModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isStatisticsModalOpen]);

  useEffect(() => {
    if (activeRegion && !showSearchResults) {
      fetchRegionData(activeRegion);
    }
  }, [activeRegion, showSearchResults]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Unknown' :
      `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  const formatTimeSince = (timestamp: number) => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m ago`;
    } else {
      return `${diffMinutes}m ago`;
    }
  };

  const toggleFolder = (folder: string) => {
    const newExpandedState: Record<string, boolean> = {};
    Object.keys(expandedFolders).forEach(key => {
      newExpandedState[key] = key === folder;
    });

    setExpandedFolders(newExpandedState);
    setActiveRegion(folder);
    setShowSearchResults(false);
    setYearFilter([]);
    setGenderFilter([]);

    const serverRegionName = getServerRegionName(folder);
    if (serverData && serverData.os && serverData.os[serverRegionName]) {
      setExpandedServerRegions(prev => ({
        ...prev,
        [serverRegionName]: true
      }));
    }
  };

  const formatLastSeen = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const toggleServerRegion = (region: string) => {
    setExpandedServerRegions(prev => ({
      ...prev,
      [region]: !prev[region]
    }));
  };

  const getDisplayedAccounts = () => {
    let accounts: Account[] = [];

    if (showSearchResults) {
      accounts = applyAllFilters(searchResults);
    } else if (regionData) {
      accounts = applyAllFilters(Object.values(regionData.accounts));
    }

    if (sortOrder) {
      accounts = [...accounts].sort((a, b) => {
        const dateA = new Date(a.registered).getTime();
        const dateB = new Date(b.registered).getTime();

        if (sortOrder === 'asc') {
          return dateA - dateB;
        } else {
          return dateB - dateA;
        }
      });
    }

    return accounts;
  };

  const displayedAccounts = getDisplayedAccounts();

  const hasActiveFilters = yearFilter.length > 0 || genderFilter.length > 0 || dateRangeFilter.start !== '' || dateRangeFilter.end !== '';

  return (
    <div className="relative z-10 h-screen w-screen p-5 bg-black/75 backdrop-blur-md transition-all duration-500 hover:bg-black/80 hover:backdrop-blur-lg shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
          Game Manager Database
        </h1>
        <div className="flex items-center space-x-4">
          {lastUpdated && !showSearchResults && (
            <div className="text-sm text-gray-400">
              Updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          <button
            onClick={() => {
              fetchIndexData();
              if (showSearchResults) {
                searchAccounts();
              } else {
                fetchRegionData(activeRegion);
              }
            }}
            disabled={isLoading || isLoadingIndex || isSearching}
            className="px-3 py-1 bg-cyan-700 hover:bg-cyan-600 rounded-md transition-colors text-sm flex items-center disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 mr-1 ${isLoading || isSearching ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Refresh
          </button>
        </div>
      </div>
      <div className="mb-6">
        <div className="flex items-center justify-between space-x-4">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            Search Database
          </h2>
          <div className="flex items-center relative" style={{ width: '88%' }}>
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchInputChange}
                placeholder="Search by name, crew name, or role id..."
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white"
                onKeyPress={(e) => e.key === 'Enter' && searchAccounts()}
              />
              {isInstantSearching && (
                <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
                </div>
              )}
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={searchAccounts}
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 rounded-r-md transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              Search
            </button>
            {searchQuery && instantSearchResults.length > 0 && !showSearchResults && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-100 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-600 scrollbar-track-gray-700 scrollbar-thumb-rounded-full">
                <div className="p-2 text-xs text-gray-400">
                  Found {instantSearchResults.length} matches. Press Enter for full search.
                </div>
                {instantSearchResults.slice(0, 5).map(account => (
                  <div
                    key={account.role_id}
                    className="p-2 hover:bg-gray-700 cursor-pointer border-t border-gray-700"
                    onClick={() => {
                      setSearchQuery(account.name);
                      setShowSearchResults(true);
                      setSearchResults(instantSearchResults);
                    }}
                  >
                    <div className="font-medium text-white">{account.name}</div>
                    <div className="text-sm text-gray-400">
                      {account.crew_name && `Crew: ${account.crew_name} • `}
                      Role ID: {account.role_id} • Region: {formatRegionName(account.server_region)}
                    </div>
                  </div>
                ))}
                {instantSearchResults.length > 5 && (
                  <div className="p-2 text-xs text-center text-cyan-400 border-t border-gray-700">
                    {instantSearchResults.length - 5} more results. Press Enter to see all.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {error && (
        <div className="mb-6 p-3 bg-red-900/50 border border-red-700 rounded-md text-red-300 text-sm flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <p className="text-gray-300 text-base mb-4 text-justify">
            This database stores player accounts across all server regions using a third-party plugin for semi-automated data collection, combined with manual verification to ensure comprehensive coverage. The system's architecture captures player names, role identifiers, server regions, crew affiliations, and timestamps. The technical implementation relies on a memory scanner for automated data extraction, which is driven by a manual workflow that requires logging into each server and traversing the game map to load player data.
          </p>
          <div className="flex flex-wrap gap-4 mb-6">
            <Link
              href="https://github.com/Nan-Yin-s-Bedroom"
              target="_blank"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Follow Us
            </Link>
            <Link
              href="https://discord.gg/Bs5cPKumFX"
              target="_blank"
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-md transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02C2.44 8.78 1.71 12.2 2.04 15.59c0 .02.01.04.03.05c1.57 1.15 3.1 1.84 4.57 2.30.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.47-.46 3-1.15 4.57-2.3c.02-.01.03-.03.03-.05c.36-3.77-.62-7.16-2.31-10.24c-.01-.02-.02-.03-.04-.03zm-10.56 8.08c-.99 0-1.8-.9-1.8-2.02s.8-2.02 1.8-2.02c1 0 1.81.9 1.8 2.02c0 1.12-.8 2.02-1.8 2.02zm6.65 0c-.99 0-1.8-.9-1.8-2.02s.8-2.02 1.8-2.02c1 0 1.81.9 1.8 2.02c0 1.12-.8 2.02-1.8 2.02z" />
              </svg>
              Join Our Community
            </Link>
          </div>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                Database Statistics:
              </h2>
              <button
                onClick={() => setIsStatisticsModalOpen(true)}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-md text-sm flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View More Statistics
              </button>
            </div>
            {isLoadingIndex ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-gray-800/50 p-4 rounded-lg text-center">
                    <div className="animate-pulse h-7 bg-gray-700 rounded mb-2"></div>
                    <div className="animate-pulse h-4 bg-gray-700 rounded w-3/4 mx-auto"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-cyan-400">
                      {indexData ? indexData.total_accounts.toLocaleString() : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-400">Total Accounts</div>
                    <div className="text-xs text-gray-500 mt-1">Across all regions</div>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {regions.length}
                    </div>
                    <div className="text-sm text-gray-400">Server Regions</div>
                    <div className="text-xs text-gray-500 mt-1">Active servers</div>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {genderStats.male.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400">Male Players</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {indexData ? `${Math.round((genderStats.male / indexData.total_accounts) * 100)}% of total` : ''}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-pink-400">
                      {genderStats.female.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400">Female Players</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {indexData ? `${Math.round((genderStats.female / indexData.total_accounts) * 100)}% of total` : ''}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Crew Statistics
                  </h3>
                  {Object.keys(crewStats).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-700/30 p-3 rounded">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Total Crews</span>
                          <span className="text-xl font-bold text-cyan-400">
                            {Object.values(crewStats).reduce((sum, stat) => sum + stat.totalCrews, 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Across all regions</div>
                      </div>
                      <div className="bg-gray-700/30 p-3 rounded">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Avg. Crew Size</span>
                          <span className="text-xl font-bold text-purple-400">
                            {(Object.values(crewStats).reduce((sum, stat) => {
                              const totalMembers = stat.averageCrewSize * stat.totalCrews;
                              return sum + totalMembers;
                            }, 0) / Object.values(crewStats).reduce((sum, stat) => sum + stat.totalCrews, 0)).toFixed(1)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Average members per crew</div>
                      </div>
                      <div className="bg-gray-700/30 p-3 rounded">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Largest Crew</span>
                          <span className="text-lg font-bold text-amber-400">
                            {(() => {
                              const largestCrews = Object.values(crewStats).map(stat => stat.largestCrew);
                              const largest = largestCrews.reduce((max, crew) => crew.size > max.size ? crew : max, { size: 0, name: 'None' });
                              return `${largest.name} (${largest.size})`;
                            })()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Biggest crew across all regions</div>
                      </div>
                      <div className="bg-gray-700/30 p-3 rounded">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">In a Crew</span>
                          <span className="text-xl font-bold text-green-400">
                            {indexData ? `${Math.round((Object.values(crewStats).reduce((sum, stat) => {
                              const totalMembers = stat.averageCrewSize * stat.totalCrews;
                              return sum + totalMembers;
                            }, 0) / indexData.total_accounts) * 100)}%` : 'N/A'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Of all players</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p>Loading crew statistics...</p>
                    </div>
                  )}
                </div>
              </>
            )}
            {indexData && (
              <div className="mt-4 text-xs text-gray-400 flex justify-between items-center">
                <span>Last Update: {formatTimestamp(indexData.last_update)}</span>
                <span className="flex items-center">
                  <svg className="w-3 h-3 mr-1 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Live from GitHub
                </span>
              </div>
            )}
          </div>
          {isStatisticsModalOpen && fullStatistics && (
            <div className="fixed inset-0 bg-black/0 backdrop-blur-0 flex items-center justify-center z-50 p-4 animate-backdrop-in">
              <div
                className="bg-gray-800/95 backdrop-blur-md rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-600 scrollbar-track-gray-700 scrollbar-thumb-rounded-full animate-fade-scale-in"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 id="modal-title" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                      Full Database Statistics
                    </h2>
                    <button
                      onClick={() => setIsStatisticsModalOpen(false)}
                      className="text-gray-400 hover:text-white transition-colors duration-200 p-1 rounded-full hover:bg-gray-700"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-gray-700/50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-cyan-400">{fullStatistics.totalAccounts.toLocaleString()}</div>
                      <div className="text-sm text-gray-400">Total Accounts</div>
                    </div>
                    <div className="bg-gray-700/50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-400">{fullStatistics.regions}</div>
                      <div className="text-sm text-gray-400">Regions</div>
                    </div>
                    <div className="bg-gray-700/50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-400">{fullStatistics.gender.male.toLocaleString()}</div>
                      <div className="text-sm text-gray-400">Male Accounts</div>
                    </div>
                    <div className="bg-gray-700/50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-pink-400">{fullStatistics.gender.female.toLocaleString()}</div>
                      <div className="text-sm text-gray-400">Female Accounts</div>
                    </div>
                    <div className="bg-gray-700/50 p-4 rounded-lg text-center">
                      {(() => {
                        const mostPopularYear = Object.entries(fullStatistics.yearly)
                          .sort(([, countA], [, countB]) => countB - countA)[0] || ['N/A', 0];
                        return (
                          <>
                            <div className="text-2xl font-bold text-amber-400">{mostPopularYear[0]}</div>
                            <div className="text-sm text-gray-400">Most Popular Year</div>
                            <div className="text-xs text-gray-300 mt-1">
                              {mostPopularYear[1].toLocaleString()} registrations
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  {fullStatistics.age && (
                    <div className="bg-gray-700/50 p-4 rounded-lg mb-6">
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Account Age Statistics
                      </h3>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-gray-600/50 p-3 rounded text-center">
                          <div className="text-xl font-bold text-cyan-400">
                            {Math.round(fullStatistics.age.averageAge)} days
                          </div>
                          <div className="text-sm text-gray-400">Average Age</div>
                        </div>

                        <div className="bg-gray-600/50 p-3 rounded text-center">
                          <div className="text-xl font-bold text-purple-400">
                            {Math.round(fullStatistics.age.medianAge)} days
                          </div>
                          <div className="text-sm text-gray-400">Median Age</div>
                        </div>

                        <div className="bg-gray-600/50 p-3 rounded text-center">
                          <div className="text-xl font-bold text-green-400">
                            {fullStatistics.age.oldestAccount.ageInDays} days
                          </div>
                          <div className="text-sm text-gray-400">Oldest Account</div>
                          <div className="text-xs text-gray-300 mt-1 truncate" title={fullStatistics.age.oldestAccount.account.name}>
                            {fullStatistics.age.oldestAccount.account.name}
                          </div>
                        </div>

                        <div className="bg-gray-600/50 p-3 rounded text-center">
                          <div className="text-xl font-bold text-blue-400">
                            {fullStatistics.age.newestAccount.ageInDays} days
                          </div>
                          <div className="text-sm text-gray-400">Newest Account</div>
                          <div className="text-xs text-gray-300 mt-1 truncate" title={fullStatistics.age.newestAccount.account.name}>
                            {fullStatistics.age.newestAccount.account.name}
                          </div>
                        </div>
                      </div>

                      <h4 className="text-md font-semibold text-white mb-2">Age Distribution</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {Object.entries(fullStatistics.age.ageDistribution)
                          .sort(([a], [b]) => {
                            const aNum = parseInt(a);
                            const bNum = parseInt(b);
                            const aUnit = a.includes('month') ? 0 : 1;
                            const bUnit = b.includes('month') ? 0 : 1;

                            if (aUnit !== bUnit) return aUnit - bUnit;
                            return aNum - bNum;
                          })
                          .map(([ageGroup, count]) => (
                            <div key={ageGroup} className="bg-gray-600/30 p-2 rounded flex justify-between items-center">
                              <span className="text-sm text-gray-300">{ageGroup}</span>
                              <span className="text-sm font-bold text-amber-400">{count}</span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                  {fullStatistics.gender.male + fullStatistics.gender.female > 0 && (
                    <div className="bg-gray-700/50 p-4 rounded-lg mb-6">
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14a3.5 3.5 0 0 0 5 0l4-4a3.5 3.5 0 0 0-5-5l-.5.5"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10a3.5 3.5 0 0 0-5 0l-4 4a3.5 3.5 0 0 0 5 5l.5-.5"></path>
                        </svg>
                        Gender Distribution
                      </h3>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-400 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                          </svg>
                          Male
                        </span>
                        <span className="text-sm text-pink-400 flex items-center">
                          Female
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                          </svg>
                        </span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-4 mb-2 relative">
                        <div
                          className="bg-blue-500 h-4 rounded-l-full absolute top-0 left-0"
                          style={{
                            width: `${(fullStatistics.gender.male / (fullStatistics.gender.male + fullStatistics.gender.female)) * 100}%`
                          }}
                        ></div>
                        <div
                          className="bg-pink-500 h-4 rounded-r-full absolute top-0 right-0"
                          style={{
                            width: `${(fullStatistics.gender.female / (fullStatistics.gender.male + fullStatistics.gender.female)) * 100}%`
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>{((fullStatistics.gender.male / (fullStatistics.gender.male + fullStatistics.gender.female)) * 100).toFixed(1)}%</span>
                        <span>{((fullStatistics.gender.female / (fullStatistics.gender.male + fullStatistics.gender.female)) * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  )}
                  {Object.keys(fullStatistics.yearly).length > 0 && (
                    <div className="bg-gray-700/50 p-4 rounded-lg mb-6">
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        Registration by Year
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {Object.entries(fullStatistics.yearly)
                          .sort(([yearA], [yearB]) => parseInt(yearB) - parseInt(yearA))
                          .map(([year, count]) => (
                            <div key={year} className="bg-gray-600/50 p-3 rounded text-center">
                              <div className="text-lg font-bold text-amber-400">{count.toLocaleString()}</div>
                              <div className="text-sm text-gray-400">{year}</div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                  <div className="bg-gray-700/50 p-4 rounded-lg mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                      </svg>
                      Crew Statistics by Region
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {regions.map(region => (
                        <div key={region} className="bg-gray-600/50 p-3 rounded">
                          <h4 className="text-md font-semibold text-amber-400 mb-2">
                            {formatRegionName(region)}
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Total Crews:</span>
                              <span className="text-cyan-400">{fullStatistics.crews[region].totalCrews.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Avg. Crew Size:</span>
                              <span className="text-purple-400">{fullStatistics.crews[region].averageCrewSize.toFixed(1)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Largest Crew:</span>
                              <span className="text-green-400" title={fullStatistics.crews[region].largestCrew.name}>
                                {fullStatistics.crews[region].largestCrew.name.length > 15
                                  ? `${fullStatistics.crews[region].largestCrew.name.substring(0, 12)}...`
                                  : fullStatistics.crews[region].largestCrew.name}
                                <span className="text-yellow-400 ml-1">({fullStatistics.crews[region].largestCrew.size})</span>
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Top 5 Crews Total:</span>
                              <span className="text-orange-400">
                                {fullStatistics.crews[region].topCrews.reduce((sum, crew) => sum + crew.size, 0).toLocaleString()} members
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {fullStatistics && (
                    <div className="bg-gray-700/50 p-4 rounded-lg mb-6">
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                        </svg>
                        Top 5 Crews by Region
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {regions.map(region => (
                          <div key={region} className="bg-gray-600/50 p-3 rounded">
                            <h4 className="text-md font-semibold text-amber-400 mb-3">
                              {formatRegionName(region)}
                            </h4>
                            {fullStatistics.crews[region].topCrews.length > 0 ? (
                              <div className="space-y-2">
                                {fullStatistics.crews[region].topCrews.map((crew, index) => (
                                  <div key={crew.name} className="flex justify-between items-center p-2 bg-gray-500/30 rounded">
                                    <div className="flex items-center">
                                      <span className="text-yellow-400 font-bold text-sm w-6">#{index + 1}</span>
                                      <span
                                        className="text-white text-sm ml-2 max-w-[120px] truncate"
                                        title={crew.name}
                                      >
                                        {crew.name}
                                      </span>
                                    </div>
                                    <span className="text-cyan-400 font-semibold">{crew.size} members</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-400 text-center py-4">No crew data available</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
            </svg>
            Database Structure:
          </h2>
          <div className="bg-gray-800/50 rounded-lg p-4 font-mono text-sm mb-4">
            <div className="text-gray-400 mb-2">accounts/</div>
            {regions.map(region => (
              <div key={region} className="ml-2 mb-1">
                <div
                  className="flex items-center cursor-pointer text-gray-300 hover:text-white"
                  onClick={() => toggleFolder(region)}
                >
                  <svg
                    className={`w-4 h-4 mr-1 transition-transform ${expandedFolders[region] ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                  {formatRegionName(region)}/
                  {indexData && indexData.regions[region] && (
                    <span className="ml-2 text-xs text-cyan-400">
                      ({indexData.regions[region].total_accounts})
                    </span>
                  )}
                </div>
                {expandedFolders[region] && (
                  <div className="ml-6 mt-1">
                    <div className="flex items-center text-amber-300">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      accounts.json
                      {indexData && indexData.regions[region] && (
                        <span className="ml-2 text-xs text-gray-400">
                          Updated {formatTimestamp(indexData.regions[region].last_update)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
            </svg>
            Database Filter:
          </h2>
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {availableYears.length > 0 && (
                <div className="p-4 bg-gray-800/50 rounded-lg flex-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">Registration Year</h3>
                    {yearFilter.length > 0 && (
                      <button
                        onClick={clearYearFilter}
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center"
                      >
                        Clear
                        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {availableYears.map(year => (
                      <label key={year} className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={yearFilter.includes(year)}
                          onChange={() => handleYearFilterChange(year)}
                          className="hidden"
                        />
                        <div className={`px-3 py-1 rounded-full text-sm transition-colors ${yearFilter.includes(year)
                          ? 'bg-cyan-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}>
                          {year}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="p-4 bg-gray-800/50 rounded-lg flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">Gender</h3>
                  {genderFilter.length > 0 && (
                    <button
                      onClick={clearGenderFilter}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center"
                    >
                      Clear
                      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={genderFilter.includes(0)}
                      onChange={() => handleGenderFilterChange(0)}
                      className="hidden"
                    />
                    <div className={`px-3 py-1 rounded-full text-sm transition-colors ${genderFilter.includes(0)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}>
                      Male
                    </div>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={genderFilter.includes(1)}
                      onChange={() => handleGenderFilterChange(1)}
                      className="hidden"
                    />
                    <div className={`px-3 py-1 rounded-full text-sm transition-colors ${genderFilter.includes(1)
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}>
                      Female
                    </div>
                  </label>
                </div>
              </div>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors text-sm flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                Clear All Filters
              </button>
            )}
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                New Accounts in Database
                <span className="ml-2 text-sm text-cyan-400">
                  ({newAccounts.length} new in last 24h)
                </span>
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={checkForNewAccounts}
                  disabled={isLoading}
                  className="px-2 py-1 bg-cyan-700 hover:bg-cyan-600 disabled:bg-cyan-800 disabled:opacity-50 rounded text-xs flex items-center"
                  title="Check for new accounts"
                >
                  <svg className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                </button>
                <button
                  onClick={clearTrackingHistory}
                  className="px-2 py-1 bg-red-700 hover:bg-red-600 rounded text-xs"
                  title="Clear tracking history"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 max-h-45 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-600 scrollbar-track-gray-700 scrollbar-thumb-rounded-full">
              {newAccounts.length > 0 ? (
                <div className="space-y-3">
                  {newAccounts.slice(0, 10).map((newAccount, index) => (
                    <div key={`${newAccount.account.role_id}-${newAccount.region}-${newAccount.firstSeen}`}
                      className="p-3 bg-gray-700/30 rounded-md hover:bg-gray-700/50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-white text-sm">{newAccount.account.name}</div>
                        <span className="text-xs text-cyan-400">
                          {formatRegionName(newAccount.region)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
                        <div>
                          {newAccount.account.crew_name && `Crew: ${newAccount.account.crew_name} • `}
                          Role ID: {newAccount.account.role_id}
                        </div>
                        <span>{formatDate(newAccount.account.registered)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className={`px-2 py-1 rounded ${newAccount.account.gender === 0 ? 'bg-blue-500/20 text-blue-300' : 'bg-pink-500/20 text-pink-300'}`}>
                          {newAccount.account.gender === 0 ? 'Male' : 'Female'}
                        </span>
                        <span className="text-green-400" title={`First seen: ${new Date(newAccount.firstSeen).toLocaleString()}`}>
                          Added {formatTimeSince(newAccount.firstSeen)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {newAccounts.length > 10 && (
                    <div className="text-center text-xs text-gray-400 pt-2">
                      {newAccounts.length - 10} more new accounts not shown
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-6">
                  <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <p>No new accounts detected in the database</p>
                  <p className="text-xs mt-1">The system tracks accounts that are newly added to the database</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            {showSearchResults ? (
              <>
                Search Results
                {searchResults.length > 0 && (
                  <span className="ml-2 text-sm text-cyan-400">
                    ({displayedAccounts.length} of {searchResults.length} matches)
                  </span>
                )}
              </>
            ) : (
              <>
                Region Information: {formatRegionName(activeRegion)}
                {indexData && indexData.regions[activeRegion] && (
                  <span className="ml-2 text-sm text-cyan-400">
                    ({displayedAccounts.length} of {indexData.regions[activeRegion].total_accounts} Shown)
                  </span>
                )}
              </>
            )}
            {hasActiveFilters && (
              <span className="ml-2 text-xs text-purple-400">
                (Filtered)
              </span>
            )}
          </h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="xl:col-span-1">
              {!showSearchResults && (
                <div className="xl:col-span-1">
                  {serverData && serverData.os && (
                    <div className="mb-4">
                      {isLoadingServers ? (
                        <div className="flex justify-center items-center h-20">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
                          <span className="ml-3 text-gray-400">Loading server data...</span>
                        </div>
                      ) : (
                        <div className="bg-gray-800/50 rounded-lg p-3">
                          <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                            </svg>
                            Server List
                          </h3>
                          {(() => {
                            const serverRegionName = getServerRegionName(activeRegion);
                            const servers = serverData.os[serverRegionName];
                            if (!servers) {
                              return (
                                <div className="text-gray-400 text-center p-4">
                                  No server information available for this region.
                                </div>
                              );
                            }
                            if ('IP Address' in servers) {
                              return (
                                <div className="p-2 bg-gray-700/50 rounded text-xs">
                                  {Object.entries(servers as ServerInfo).map(([key, value]) => (
                                    <div key={key} className="flex mb-1 last:mb-0">
                                      <span className="text-gray-400 w-24 flex-shrink-0">{key}:</span>
                                      <span className="text-gray-300">{value}</span>
                                    </div>
                                  ))}
                                </div>
                              );
                            } else {
                              return (
                                <div className="space-y-2">
                                  {Object.entries(servers as RegionServerInfo).map(([serverName, serverInfo]) => (
                                    <div key={serverName} className="mb-2 last:mb-0">
                                      <h3 className="text-cyan-400 text-md font-semibold mb-2">{serverName}</h3>
                                      <div className="p-2 bg-gray-700/50 rounded text-xs">
                                        {Object.entries(serverInfo).map(([key, value]) => (
                                          <div key={key} className="flex mb-1 last:mb-0">
                                            <span className="text-gray-400 w-24 flex-shrink-0">{key}:</span>
                                            <span className="text-gray-300">{value}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            }
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="xl:col-span-1">
              <div className="flex items-center space-x-3 gap-2 mb-4">
                {sortOrder && (
                  <button
                    onClick={clearSort}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center"
                    title="Clear sorting"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    Clear
                  </button>
                )}
                <div className="relative group">
                  <button className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-300 hover:bg-gray-600 flex items-center">
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    Date Range
                    {(dateRangeFilter.start || dateRangeFilter.end) && (
                      <span className="ml-1 w-2 h-2 bg-cyan-500 rounded-full"></span>
                    )}
                  </button>
                  <div className="absolute left-0 mt-2 w-64 p-4 bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-white">Date Range Filter</h3>
                      {(dateRangeFilter.start || dateRangeFilter.end) && (
                        <button
                          onClick={clearDateRangeFilter}
                          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center"
                          title="Clear date range"
                        >
                          Clear
                          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Start Date</label>
                        <input
                          type="date"
                          value={dateRangeFilter.start}
                          onChange={(e) => handleDateRangeChange('start', e.target.value)}
                          className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-transparent text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">End Date</label>
                        <input
                          type="date"
                          value={dateRangeFilter.end}
                          onChange={(e) => handleDateRangeChange('end', e.target.value)}
                          className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-transparent text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleSort('asc')}
                  className={`px-2 py-1 rounded text-xs ${sortOrder === 'asc' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                  title="Sort by registration date (oldest first)"
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path>
                  </svg>
                  Oldest
                </button>
                <button
                  onClick={() => handleSort('desc')}
                  className={`px-2 py-1 rounded text-xs ${sortOrder === 'desc' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                  title="Sort by registration date (newest first)"
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"></path>
                  </svg>
                  Newest
                </button>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 max-h-158 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-600 scrollbar-track-gray-700 scrollbar-thumb-rounded-full">
                {showSearchResults ? (
                  <>
                    {isSearching ? (
                      <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                        <span className="ml-3 text-gray-400">Searching across all regions...</span>
                      </div>
                    ) : displayedAccounts.length > 0 ? (
                      <div className="space-y-4">
                        {displayedAccounts.map(account => (
                          <div key={account.role_id} className="p-3 bg-gray-700/50 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold text-white">{account.name}</h3>
                                <p className="text-sm text-gray-400">
                                  Crew: {account.crew_name || "None"}
                                </p>
                                <p className="text-xs text-purple-400">
                                  Registered: {account.registered}
                                </p>
                                <p className="text-xs text-amber-400 mt-1">
                                  Age: {calculateAccountAge(account.registered)} days
                                </p>
                                <p className="text-xs text-amber-400 mt-1">
                                  Region: {formatRegionName(account.server_region)}
                                </p>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs ${account.gender === 0 ? 'bg-blue-500/20 text-blue-300' : 'bg-pink-500/20 text-pink-300'
                                }`}>
                                {account.gender === 0 ? 'Male' : 'Female'}
                              </span>
                            </div>
                            <div className="mt-2 text-xs text-gray-400">
                              <p>Last seen: {formatLastSeen(account.last_seen)}</p>
                              <p>Role ID: {account.role_id}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center p-6">
                        {searchQuery && hasActiveFilters
                          ? 'No accounts found matching your search and filter criteria.'
                          : searchQuery
                            ? 'No accounts found matching your search.'
                            : 'Enter a search term to find accounts.'}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    {isLoading ? (
                      <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                        <span className="ml-3 text-gray-400">Loading data from GitHub...</span>
                      </div>
                    ) : error ? (
                      <div className="flex flex-col items-center justify-center h-40 text-red-300">
                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                        <p>Failed to load data. Please try again.</p>
                      </div>
                    ) : displayedAccounts.length > 0 ? (
                      <div className="space-y-4">
                        {displayedAccounts.map(account => (
                          <div key={account.role_id} className="p-3 bg-gray-700/50 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold text-white">{account.name}</h3>
                                <p className="text-sm text-gray-400">
                                  Crew: {account.crew_name || "None"}
                                </p>
                                <p className="text-xs text-purple-400">
                                  Registered: {account.registered}
                                </p>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs ${account.gender === 0 ? 'bg-blue-500/20 text-blue-300' : 'bg-pink-500/20 text-pink-300'
                                }`}>
                                {account.gender === 0 ? 'Male' : 'Female'}
                              </span>
                            </div>
                            <div className="mt-2 text-xs text-gray-400">
                              <p>Last seen: {formatLastSeen(account.last_seen)}</p>
                              <p>Role ID: {account.role_id}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center p-6">
                        {hasActiveFilters
                          ? 'No accounts found matching your filter criteria.'
                          : 'No accounts found in this region.'}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-2 text-center text-sm text-gray-500 flex flex-col items-center">
        <p className="flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Data fetched directly from <a href="https://github.com/Nan-Yin-s-Bedroom/tofgm-database" className="text-cyan-400 hover:underline">GitHub Repository</a>. GitHub may rate limit requests if accessed too frequently.
        </p>
        <p className="flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Note: This is not affiliated with Hotta Studio, Perfect World and Tower of Fantasy. Data collection depends on third-party programs and manual verification.
        </p>
      </div>
    </div>
  );
}