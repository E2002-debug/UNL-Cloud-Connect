import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, X, Thermometer, Wind, AlertTriangle, CloudRain, BellRing, ChevronDown, ChevronUp } from 'lucide-react';
import { getLojaWeather } from '../services/weatherService';
import { WeatherData } from '../types';
import { cn } from '../lib/utils';

export default function WeatherAlertOverlay() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLojaWeather()
      .then((data) => {
        setWeather(data);
        setLoading(false);
        // Automatically open the alert if extreme conditions are detected
        if (data.rainChance > 80 || data.windSpeed > 20 || data.temp < 12 || data.temp > 25) {
          setIsOpen(true);
        } else {
          setIsOpen(false); // If perfectly normal, do not show emergency alert unless they expand it
        }
      })
      .catch((err) => {
        console.error('Error fetching weather for alert overlay:', err);
        setLoading(false);
      });
  }, []);

  if (loading || !weather) return null;

  // Determine alert type based on the weather measurements
  const hasExtremeRain = weather.rainChance > 80;
  const hasExtremeWind = weather.windSpeed > 20;
  const hasExtremeTemperature = weather.temp < 12 || weather.temp > 25;

  // If there's no extreme weather at all, we could show a subtle preview, but we default to not showing unless extreme
  const isExtreme = hasExtremeRain || hasExtremeWind || hasExtremeTemperature;

  if (!isExtreme && !isExpanded) {
    return null; // Don't annoy the user if weather is perfectly calm and fine
  }

  // Set alert text details
  let alertTitle = "AVISO METEOROLÓGICO ACTIVO";
  let alertDescription = "El cluster UNL ha registrado parámetros climáticos estables en la hoya de Loja.";
  let severity: 'warning' | 'critical' | 'info' = 'info';

  if (hasExtremeRain) {
    alertTitle = "CRÍTICO: ALERTA DE PRECIPITACIONES PLUVIALES";
    alertDescription = `Se detecta una probabilidad de lluvia extrema del ${weather.rainChance}% en el área metropolitana de Loja. Riesgo de acumulación de escorrentía superficial y tormentas eléctricas.`;
    severity = 'critical';
  } else if (hasExtremeWind) {
    alertTitle = "AVISO: VIENTOS INTEGRADOS DE ALTA VELOCIDAD";
    alertDescription = `Viento sostenido a ${weather.windSpeed.toFixed(1)} km/h. Se recomienda asegurar equipos de censado externos de la red UNL.`;
    severity = 'warning';
  } else if (weather.temp < 12) {
    alertTitle = "PRECAUCIÓN: DESCENSO TÉRMICO ACENTUADO";
    alertDescription = `Sensación térmica de ${weather.feelsLike.toFixed(1)}°C. Humedad relativa alta en campus de Loja.`;
    severity = 'warning';
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className={cn(
            "fixed top-24 left-1/2 -translate-x-1/2 z-[310] w-[92%] max-w-lg p-5 border-2 relative select-none shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-md",
            severity === 'critical' 
              ? "bg-[#0a0f1d]/95 border-[#0F766E] text-[#0F766E]" 
              : "bg-[#0A0700]/95 border-[#f59e0b] text-[#f59e0b]"
          )}
        >
          {/* High-tech corners styles */}
          <div className={cn(
            "absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2",
            severity === 'critical' ? "border-[#0F766E]" : "border-[#f59e0b]"
          )} />
          <div className={cn(
            "absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2",
            severity === 'critical' ? "border-[#0F766E]" : "border-[#f59e0b]"
          )} />
          <div className={cn(
            "absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2",
            severity === 'critical' ? "border-[#0F766E]" : "border-[#f59e0b]"
          )} />
          <div className={cn(
            "absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2",
            severity === 'critical' ? "border-[#0F766E]" : "border-[#f59e0b]"
          )} />

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              {hasExtremeRain ? (
                <ShieldAlert className="w-8 h-8 text-[#0F766E] animate-pulse" />
              ) : (
                <AlertTriangle className="w-7 h-7 text-[#f59e0b] animate-bounce" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                   "text-[8px] font-black uppercase tracking-[0.3em] px-2 py-0.5 rounded-none",
                   severity === 'critical' ? "bg-[#0F766E] text-white" : "bg-[#f59e0b] text-black"
                )}>
                  {severity === 'critical' ? "EMERGENCIA CLIMÁTICA" : "ADVERTENCIA"}
                </span>
                <span className="text-[9px] font-mono opacity-65">ESTACIÓN CENTRAL UNL</span>
              </div>
              <h4 className="text-sm font-black uppercase tracking-tight italic leading-snug">
                {alertTitle}
              </h4>
              <p className="text-xs text-white uppercase font-bold mt-1.5 leading-relaxed tracking-wide opacity-90">
                {alertDescription}
              </p>

              {/* Advanced telemetry details toggled item */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-4 text-[10px] text-white font-mono uppercase"
                  >
                    <div className="space-y-1 bg-black/40 p-2 border border-white/5">
                      <span className="text-zinc-500 block">Prob. Lluvia:</span>
                      <span className={cn("font-bold text-xs", hasExtremeRain ? "text-[#0F766E]" : "text-[#f59e0b]")}>
                        {weather.rainChance}%
                      </span>
                    </div>
                    <div className="space-y-1 bg-black/40 p-2 border border-white/5">
                      <span className="text-zinc-500 block">Veloc. Viento:</span>
                      <span className="font-bold text-xs text-zinc-300">
                        {weather.windSpeed.toFixed(1)} km/h
                      </span>
                    </div>
                    <div className="space-y-1 bg-black/40 p-2 border border-white/5">
                      <span className="text-zinc-500 block">Temperatura:</span>
                      <span className="font-bold text-xs text-zinc-300">
                        {weather.temp.toFixed(1)}°C
                      </span>
                    </div>
                    <div className="space-y-1 bg-black/40 p-2 border border-white/5">
                      <span className="text-zinc-500 block">Humedad:</span>
                      <span className="font-bold text-xs text-zinc-300">
                        {weather.humidity}%
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons to collapse & detail */}
              <div className="flex gap-4 mt-4">
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/70 hover:text-white hover:underline transition-colors focus:outline-none"
                >
                  {isExpanded ? (
                    <>Ocultar Detalles <ChevronUp className="w-3.5 h-3.5" /></>
                  ) : (
                    <>Ver Diagnóstico UNL <ChevronDown className="w-3.5 h-3.5" /></>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:underline transition-colors focus:outline-none ml-auto"
                >
                  Entendido
                </button>
              </div>
            </div>

            {/* Close Cross icon */}
            <button
              onClick={() => setIsOpen(false)}
              className="flex-shrink-0 text-white/40 hover:text-white p-1 ml-2 transition-colors focus:outline-none"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
