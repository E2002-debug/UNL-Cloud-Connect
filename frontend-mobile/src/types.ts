/**
 * Loja-Cloud-Live Types
 */

export interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
  rainChance: number;
  uvIndex: number;
  timestamp: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: 'festival' | 'concert' | 'fair' | 'cultural';
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  date: string;
  weather?: WeatherData;
  attendeesCount: number;
  imageUrl?: string;
}

export interface SocialPost {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  imageUrl: string;
  caption: string;
  timestamp: number;
  analysis?: string; // AI sensing analysis
}

export interface SystemStatus {
  activeUsers: number;
  cpuLoad: number;
  memoryUsage: number;
  storageUsed: number;
  storageUnit: 'GB' | 'MB';
  lastSync: number;
}

export interface WeatherAlert {
  id: string;
  type: 'rain' | 'wind' | 'cold' | 'heat';
  severity: 'low' | 'medium' | 'high';
  message: string;
  eventId?: string;
  timestamp: number;
}
