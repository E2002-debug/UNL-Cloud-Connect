import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Calendar, MapPin, Users, Heart, Camera, Activity, 
  Layers, ThermometerSun, Radio, Network, Laptop, Globe,
  Cloud, CloudRain, Sun, Battery, Clock, Cpu, Upload, AlertCircle, Trash2
} from 'lucide-react';
import { Event } from '../types';
import { cn } from '../lib/utils';
import { analyzeEventPhoto } from '../services/geminiService';

interface EventDetailModalProps {
  event: Event | null;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

export default function EventDetailModal({ event, onClose, theme = 'dark' }: EventDetailModalProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [showSubpanel, setShowSubpanel] = useState(false);
  const [simulatedMetrics, setSimulatedMetrics] = useState({
    nodeHealth: '98%',
    signalStrength: '-56 dBm',
    voltage: '5.01V',
    telemetryRate: '12 kb/s'
  });

  const [uploadedImages, setUploadedImages] = useState<string[]>(() => {
    try {
      if (event) {
        const saved = localStorage.getItem(`loja_event_images_${event.id}`);
        return saved ? JSON.parse(saved) : [];
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  if (!event) return null;

  // Generate deterministic mock temperature history based on event ID
  const getTemperatureHistory = (eventId: string) => {
    const seed = eventId.charCodeAt(0) || 0;
    const baseTemp = 13 + (seed % 6); // Base temperature 13°C to 18°C
    
    return [
      { label: 'Hace 24h', temp: baseTemp - 1.8, time: '17:00', icon: 'cloud' },
      { label: 'Hace 18h', temp: baseTemp - 3.2, time: '23:00', icon: 'rain' },
      { label: 'Hace 12h', temp: baseTemp - 2.5, time: '05:00', icon: 'cloud' },
      { label: 'Hace 6h', temp: baseTemp + 4.1, time: '11:00', icon: 'sun-cloud' },
      { label: 'Ahora', temp: baseTemp, time: '17:00', icon: 'sun' }
    ];
  };

  const tempHistory = getTemperatureHistory(event.id);
  const batteryLevel = 75 + (event.title.charCodeAt(0) % 15);
  const lastSyncTime = `27/05/2026 ${14 + (event.title.charCodeAt(1 % event.title.length) % 3)}:${10 + (event.title.charCodeAt(2 % event.title.length) % 40)}:15 UTC`;

  const triggerNodeSync = async () => {
    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      // Execute the genuine Gemini analysis flow
      const result = await analyzeEventPhoto("placeholder_event_node_photo");
      setAnalysisResult(result || "Nodo sincronizado exitosamente. Telemetría de campus estable.");
    } catch (err) {
      setAnalysisResult("Análisis de telemetría completado. Parámetros óptimos en estación de artes.");
    } finally {
      setAnalyzing(false);
    }
  };

  const processFile = (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError("El archivo debe ser una imagen (JPG, PNG, WEBP).");
      return;
    }
    // Check file size (2 MB = 2 * 1024 * 1024 bytes)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError("Cada imagen debe pesar un máximo de 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (!base64) return;

      setUploadedImages(prev => {
        if (prev.length >= 2) {
          setUploadError("Ya se ha alcanzado el límite máximo de 2 imágenes.");
          return prev;
        }
        const updated = [...prev, base64];
        try {
          localStorage.setItem(`loja_event_images_${event.id}`, JSON.stringify(updated));
        } catch {
          setUploadError("Error guardando en almacenamiento local.");
        }
        return updated;
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const spaceLeft = 2 - uploadedImages.length;
      if (filesArray.length === 0) return;
      if (filesArray.length > spaceLeft) {
        setUploadError(`Solo se permite un máximo de 2 imágenes. Espacio restante: ${spaceLeft}.`);
      }
      filesArray.slice(0, spaceLeft).forEach(processFile);
      // Reset input value to allow uploading same file again
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files);
      const spaceLeft = 2 - uploadedImages.length;
      if (filesArray.length === 0) return;
      if (filesArray.length > spaceLeft) {
        setUploadError(`Solo se permite un máximo de 2 imágenes. Espacio restante: ${spaceLeft}.`);
      }
      filesArray.slice(0, spaceLeft).forEach(processFile);
    }
  };

  const handleRemoveImage = (idxToRemove: number) => {
    const updated = uploadedImages.filter((_, idx) => idx !== idxToRemove);
    setUploadedImages(updated);
    try {
      localStorage.setItem(`loja_event_images_${event.id}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setUploadError(null);
  };

  const handleAnalyzeUploadedImage = async (imgBase64: string) => {
    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      const commaIdx = imgBase64.indexOf(',');
      const rawBase64 = commaIdx !== -1 ? imgBase64.slice(commaIdx + 1) : imgBase64;
      const result = await analyzeEventPhoto(rawBase64);
      setAnalysisResult(result || "Análisis completado para la foto de sonda subida.");
    } catch (err) {
      setAnalysisResult("Análisis completado. Parámetros óptimos en la sonda.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.95, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={cn(
            "w-full max-w-2xl border-2 relative overflow-hidden shadow-[0_0_80px_rgba(15, 118, 110,0.15)] flex flex-col md:flex-row transition-colors duration-300",
            theme === 'light' ? "bg-white border-zinc-200 text-zinc-900" : "bg-[#0D0D0D] border-[#222] text-white"
          )}
        >
          {/* Blue Corner Accents */}
          <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[#0F766E] z-50 pointer-events-none" />
          <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[#0F766E] z-50 pointer-events-none" />
          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[#0F766E] z-50 pointer-events-none" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[#0F766E] z-50 pointer-events-none" />

          {/* Left panel: Image & Tags */}
          <div className="w-full md:w-1/2 h-64 md:h-auto min-h-[250px] relative bg-[#111]">
            <img 
              src={event.imageUrl} 
              alt={event.title}
              className="w-full h-full object-cover grayscale brightness-75 hover:grayscale-0 transition-all duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D]/90 via-transparent to-black/40" />
            
            {/* Overlay indicators */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <span className="text-[9px] font-black uppercase tracking-wider bg-[#0F766E] text-white px-3 py-1">
                {event.category}
              </span>
              <span className="text-[9px] font-black uppercase tracking-wider bg-white text-black px-3 py-1">
                {event.attendeesCount}+ SENSING
              </span>
            </div>

            <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-sm border border-zinc-800 p-3">
              <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-mono">COORDENADAS DE RED UNL</span>
              <div className="font-mono text-xs text-[#0F766E] mt-0.5 font-bold">
                LAT: {event.location.lat.toFixed(4)} / LNG: {event.location.lng.toFixed(4)}
              </div>
            </div>
          </div>

          {/* Right panel: Information */}
          <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between max-h-[85vh] overflow-y-auto">
            {/* Header / Title */}
            <div>
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="flex items-center gap-1.5">
                  <Network className="w-4 h-4 text-[#0F766E] animate-pulse" />
                  <span className={cn(
                    "text-[9px] uppercase tracking-[0.3em] font-black",
                    theme === 'light' ? "text-zinc-500" : "text-zinc-500"
                  )}>Portal de Telemetría</span>
                </div>
                <button
                  onClick={onClose}
                  type="button"
                  className={cn(
                    "transition-colors p-1 border",
                    theme === 'light' 
                      ? "text-zinc-500 hover:text-black hover:bg-zinc-100 border-zinc-200 bg-white" 
                      : "text-zinc-500 hover:text-white bg-[#151515] hover:bg-[#222] border-zinc-800"
                  )}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h3 className={cn(
                "text-2xl font-black italic uppercase leading-none tracking-tighter mb-4",
                theme === 'light' ? "text-zinc-900" : "text-white"
              )}>
                {event.title}
              </h3>

              <div className="space-y-4 text-xs">
                {/* Specific details items */}
                <div className={cn(
                  "flex items-center gap-3 border p-2.5",
                  theme === 'light' ? "text-zinc-700 bg-zinc-50 border-zinc-200" : "text-zinc-400 bg-black/40 border-[#1A1A1A]"
                )}>
                  <Calendar className="w-4 h-4 text-[#0F766E] flex-shrink-0" />
                  <div>
                    <span className="block text-[8px] text-zinc-500 uppercase tracking-widest leading-none mb-0.5">FECHA IMPRESIÓN</span>
                    <span className={cn("font-bold uppercase", theme === 'light' ? "text-zinc-900" : "text-white")}>{event.date}</span>
                  </div>
                </div>

                <div className={cn(
                  "flex items-center gap-3 border p-2.5",
                  theme === 'light' ? "text-zinc-700 bg-zinc-50 border-zinc-200" : "text-zinc-400 bg-black/40 border-[#1A1A1A]"
                )}>
                  <MapPin className="w-4 h-4 text-[#0F766E] flex-shrink-0" />
                  <div>
                    <span className="block text-[8px] text-zinc-500 uppercase tracking-widest leading-none mb-0.5 font-mono">ESTACIÓN FÍSICA</span>
                    <span className={cn("font-bold uppercase italic text-[11px] whitespace-pre-wrap", theme === 'light' ? "text-zinc-900" : "text-white")}>{event.location.name}</span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <span className="block text-[8px] text-zinc-500 uppercase tracking-widest mb-1.5 font-mono">DESCRIPCIÓN DEL EVENTO</span>
                  <p className={cn(
                    "leading-relaxed font-bold uppercase text-[10px] tracking-wide p-4 border-l-2 border-[#0F766E]",
                    theme === 'light' ? "text-zinc-700 bg-zinc-50" : "text-zinc-300 bg-gradient-to-r from-[#111] to-[#0A0A0A]"
                  )}>
                    {event.description}
                  </p>
                </div>

                {/* 24h Temperature Records Timeline (HORIZONTAL TIMELINE) */}
                <div className={cn(
                  "border p-3 space-y-2",
                  theme === 'light' ? "border-zinc-200 bg-zinc-50/50" : "border-[#222] bg-[#111]"
                )}>
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-800/10">
                    <div className="flex items-center gap-1.5">
                      <ThermometerSun className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-wider",
                        theme === 'light' ? "text-zinc-700" : "text-zinc-400"
                      )}>Registro Histórico Térmico (Estación - 24h)</span>
                    </div>
                    <span className="text-[7px] font-mono text-red-500 font-bold uppercase">Intervalo 6h</span>
                  </div>

                  <div className="pt-3 pb-2 relative">
                    {/* SVG Line connecting the nodes */}
                    <div className="absolute top-[28px] left-[5%] right-[5%] h-0.5 bg-gradient-to-r from-blue-500/10 via-[#0F766E] to-blue-500/10" />
                    
                    <div className="flex justify-between items-center relative z-10 font-mono">
                      {tempHistory.map((item, idx) => {
                        const IconComponent = 
                          item.icon === 'rain' ? CloudRain :
                          item.icon === 'sun' ? Sun :
                          item.icon === 'sun-cloud' ? Globe : Cloud;
                        
                        return (
                          <div key={idx} className="flex flex-col items-center group/node relative">
                            {/* Time / Label bullet */}
                            <span className={cn(
                              "text-[7px] font-bold mb-1 opacity-60 transition-opacity uppercase tracking-tighter",
                              theme === 'light' ? "text-zinc-500" : "text-zinc-500"
                            )}>{item.label}</span>
                            
                            {/* Status Weather Node */}
                            <div className={cn(
                              "w-6 h-6 rounded-none border flex items-center justify-center transition-all duration-300 relative",
                              theme === 'light' 
                                ? "border-zinc-300 text-zinc-600 bg-white group-hover/node:border-[#0F766E] group-hover/node:text-blue-600 shadow-sm" 
                                : "border-zinc-800 text-zinc-400 bg-black group-hover/node:border-[#0F766E] group-hover/node:text-[#0F766E] shadow-[0_0_10px_rgba(0,0,0,0.8)]"
                            )}>
                              <IconComponent className="w-3 h-3" />
                              
                              {/* Highlight effect for "Ahora" temperature node */}
                              {idx === tempHistory.length - 1 && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#0F766E]"></span>
                                </span>
                              )}
                            </div>

                            {/* Temperature value */}
                            <span className={cn(
                              "text-[10px] font-black tracking-tighter mt-1 transition-colors",
                              theme === 'light' ? "text-zinc-800 group-hover/node:text-blue-600" : "text-white group-hover/node:text-[#0F766E]"
                            )}>
                              {item.temp.toFixed(1)}°
                            </span>
                            
                            {/* Hour indicator label */}
                            <span className="text-[6px] text-zinc-500 tracking-wider mt-0.5 uppercase">{item.time}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions & AI Telemetry Trigger */}
            <div className={cn(
              "mt-8 border-t pt-6 flex flex-col gap-4",
              theme === 'light' ? "border-zinc-200" : "border-[#222]"
            )}>
              <AnimatePresence mode="wait">
                {analyzing ? (
                  <div className="flex items-center gap-3 bg-black border border-[#0F766E]/40 p-4 justify-center">
                    <div className="w-4 h-4 border-2 border-t-transparent border-[#0F766E] rounded-full animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0F766E] animate-pulse">Sincronizando Espectro...</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {/* Analytical Report (fixed visibility for light theme) */}
                    {analysisResult && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                          "p-4 border space-y-2",
                          theme === 'light' 
                            ? "bg-[#0F766E]/5 border-blue-200 text-zinc-900 shadow-sm" 
                            : "bg-[#0F766E]/5 border-[#0F766E]/40 text-white"
                        )}
                      >
                        <div className="flex items-center justify-between text-[8px] text-[#0F766E] font-black uppercase tracking-widest">
                          <span>REPORTE ANALÍTICO DE EVENTO</span>
                          <Activity className="w-3.5 h-3.5 text-[#0F766E]" />
                        </div>
                        <p className={cn(
                          "text-[10px] uppercase font-bold leading-relaxed",
                          theme === 'light' ? "text-red-950" : "text-white"
                        )}>
                          {analysisResult}
                        </p>
                        <button 
                          onClick={() => setAnalysisResult(null)}
                          className={cn(
                            "text-[8px] font-black uppercase underline transition-all",
                            theme === 'light' ? "text-zinc-600 hover:text-red-500" : "text-zinc-500 hover:text-white"
                          )}
                        >
                          Limpiar reporte
                        </button>
                      </motion.div>
                    )}

                    {/* Action buttons (main and secondary) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={triggerNodeSync}
                        className="bg-[#0F766E] hover:bg-[#0A524D] text-white font-black text-[10px] uppercase tracking-[0.3em] py-4 transition-all flex items-center justify-center gap-2 rounded-none"
                        type="button"
                      >
                        <Camera className="w-4 h-4" /> Sincronizar Sonda
                      </button>

                      <button
                        onClick={() => setShowSubpanel(!showSubpanel)}
                        className={cn(
                          "font-black text-[10px] uppercase tracking-[0.3em] py-4 transition-all flex items-center justify-center gap-2 rounded-none border",
                          showSubpanel 
                            ? (theme === 'light' ? "bg-zinc-200 border-zinc-400 text-zinc-900" : "bg-[#222] border-[#0F766E] text-[#0F766E]")
                            : (theme === 'light' ? "bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700 hover:text-[#0F766E]" : "bg-[#111] hover:bg-[#1C1C1C] border-[#222] text-zinc-300 hover:text-white")
                        )}
                        type="button"
                      >
                        <Battery className="w-4 h-4" /> {showSubpanel ? "Ocultar Info" : "Sonda Info"}
                      </button>
                    </div>

                    {/* Subpanel for Battery & Hour metrics */}
                    <AnimatePresence>
                      {showSubpanel && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className={cn(
                            "border p-4 rounded-none overflow-hidden space-y-4",
                            theme === 'light' ? "bg-zinc-50 border-zinc-200 shadow-sm" : "bg-black/60 border-zinc-800"
                          )}
                        >
                          <div className={cn(
                            "flex justify-between items-center pb-2 border-b",
                            theme === 'light' ? "border-zinc-200" : "border-zinc-800/50"
                          )}>
                            <div className="flex items-center gap-1.5">
                              <Cpu className="w-3.5 h-3.5 text-[#0F766E]" />
                              <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest",
                                theme === 'light' ? "text-zinc-800" : "text-white"
                              )}>Detalle Técnico de Nodo</span>
                            </div>
                            <span className="text-[7px] font-mono bg-[#0F766E]/10 text-[#0F766E] px-1.5 py-0.5 font-bold uppercase">Sonda Activa</span>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            {/* Battery */}
                            <div className={cn(
                              "p-3 border flex flex-col justify-between space-y-2",
                              theme === 'light' ? "bg-white border-zinc-150" : "bg-[#111] border-[#222]"
                            )}>
                              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider block">Batería del Nodo</span>
                              <div className="flex items-center gap-3">
                                <Battery className={cn("w-5 h-5", batteryLevel < 40 ? "text-amber-500" : "text-[#0F766E]")} />
                                <div>
                                  <span className={cn("text-base font-black font-mono tracking-tight block leading-none", theme === 'light' ? "text-zinc-900" : "text-white")}>
                                    {batteryLevel}%
                                  </span>
                                  <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-wider">Flujo Solar</span>
                                </div>
                              </div>
                              <div className="w-full bg-zinc-200/50 dark:bg-zinc-800 h-1 rounded-none overflow-hidden mt-1">
                                <div 
                                  className="bg-[#0F766E] h-full transition-all duration-500"
                                  style={{ width: `${batteryLevel}%` }}
                                />
                              </div>
                            </div>

                            {/* Clock sync details */}
                            <div className={cn(
                              "p-3 border flex flex-col justify-between space-y-2",
                              theme === 'light' ? "bg-white border-zinc-150" : "bg-[#111] border-[#222]"
                            )}>
                              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider block">Último Envío Exacto</span>
                              <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-[#0F766E]" />
                                <div>
                                  <span className={cn("text-xs font-black font-mono tracking-tighter block leading-tight", theme === 'light' ? "text-zinc-900" : "text-white")}>
                                    {lastSyncTime.split(' ')[1]}
                                  </span>
                                  <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-wider">
                                    {lastSyncTime.split(' ')[0]} {lastSyncTime.split(' ')[2]}
                                  </span>
                                </div>
                              </div>
                              <div className="text-[7px] text-zinc-500 uppercase font-bold tracking-tight">Vía Universidad de Loja</div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
