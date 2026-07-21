import axios from 'axios';
import { WeatherData } from '../types';

const API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY;
const LOJA_QUERY = 'Loja,EC';

export interface WeatherResponse {
  currentConditions: {
    temp: number;
    humidity: number;
    windspeed: number;
    conditions: string;
    icon: string;
    feelslike: number;
    uvindex: number;
    precipprob: number;
  };
}

export async function getLojaWeather(): Promise<WeatherData> {
  // Always use current weather for Loja
  try {
    const response = await axios.get<WeatherResponse>(
      `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${LOJA_QUERY}?unitGroup=metric&key=${API_KEY}&contentType=json&include=current`
    );
    const data = response.data.currentConditions;
    return {
      temp: data.temp,
      description: data.conditions,
      icon: data.icon, // Visual crossing icons are usually named like 'rain', 'partly-cloudy-day'
      humidity: data.humidity,
      windSpeed: data.windspeed,
      feelsLike: data.feelslike,
      rainChance: data.precipprob || 0,
      uvIndex: data.uvindex,
      timestamp: Date.now(),
    };
  } catch (error: any) {
    console.warn('Weather API Error, using realistic fallback:', error.message);
    return {
      temp: undefined,
      description: 'Sin conexión',
      icon: 'cloudy',
      humidity: undefined,
      windSpeed: undefined,
      feelsLike: undefined,
      rainChance: undefined,
      uvIndex: undefined,
      timestamp: Date.now(),
    };
  }
}
