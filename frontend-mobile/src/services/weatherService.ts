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

function getWeatherDescription(code: number): string {
  if (code === 0) return 'Despejado';
  if (code >= 1 && code <= 3) return 'Parcialmente Nublado';
  if (code >= 45 && code <= 48) return 'Niebla';
  if (code >= 51 && code <= 67) return 'Lluvia Ligera';
  if (code >= 80 && code <= 99) return 'Lluvia Moderada';
  return 'Templado';
}

function getWeatherIcon(code: number): string {
  if (code === 0) return 'clear-day';
  if (code >= 1 && code <= 3) return 'partly-cloudy-day';
  if (code >= 51 && code <= 99) return 'rain';
  return 'cloudy';
}

export async function getLojaWeather(): Promise<WeatherData> {
  // 1. Intentar con VisualCrossing si hay API Key válida
  if (API_KEY) {
    try {
      const response = await axios.get<WeatherResponse>(
        `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${LOJA_QUERY}?unitGroup=metric&key=${API_KEY}&contentType=json&include=current`
      );
      const data = response.data.currentConditions;
      return {
        temp: Math.round(data.temp),
        description: data.conditions,
        icon: data.icon || 'partly-cloudy-day',
        humidity: Math.round(data.humidity),
        windSpeed: Math.round(data.windspeed),
        feelsLike: Math.round(data.feelslike),
        rainChance: data.precipprob || 0,
        uvIndex: data.uvindex,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      console.warn('VisualCrossing API no disponible, probando Open-Meteo...');
    }
  }

  // 2. Fallback a Open-Meteo (Gratuito, sin API key requerida para Loja)
  try {
    const response = await axios.get(
      'https://api.open-meteo.com/v1/forecast?latitude=-3.9931&longitude=-79.2042&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m'
    );
    const curr = response.data.current;
    return {
      temp: Math.round(curr.temperature_2m),
      description: getWeatherDescription(curr.weather_code),
      icon: getWeatherIcon(curr.weather_code),
      humidity: Math.round(curr.relative_humidity_2m),
      windSpeed: Math.round(curr.wind_speed_10m),
      feelsLike: Math.round(curr.temperature_2m),
      rainChance: 15,
      uvIndex: 5,
      timestamp: Date.now(),
    };
  } catch (openMeteoError: any) {
    console.warn('Error en Open-Meteo, utilizando respaldo estático:', openMeteoError.message);
    return {
      temp: 18,
      description: 'Parcialmente Nublado',
      icon: 'partly-cloudy-day',
      humidity: 72,
      windSpeed: 10,
      feelsLike: 18,
      rainChance: 15,
      uvIndex: 5,
      timestamp: Date.now(),
    };
  }
}
