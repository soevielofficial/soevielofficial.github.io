export interface ServerInfo {
  "IP Address": string;
  Hostname: string;
  ASN: string;
  ISP: string;
  Services: string;
  Country: string;
  "State Region": string;
  City: string;
  Latitude: string;
  Longitude: string;
}

export interface ServerData {
  os: Record<string, ServerInfo>;
  cn: Record<string, ServerInfo>;
}

export const fetchServerData = async (): Promise<ServerData> => {
  const response = await fetch('https://raw.githubusercontent.com/soevielofficial/tof-server/refs/heads/main/server.json');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
};