/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import logoImg from './img/logo.png';
import { 
  BarChart3, 
  Smartphone, 
  Database, 
  Bell, 
  Activity, 
  CloudRain, 
  Camera, 
  Map as MapIcon, 
  Wifi, 
  Settings,
  ShieldAlert,
  Calendar,
  Layers,
  ThermometerSun,
  User,
  LogOut,
  Mail,
  Award,
  History,
  Droplets,
  Wind,
  Sun,
  Moon,
  Thermometer,
  ArrowUpRight,
  RefreshCw,
  Clock,
  Plus,
  Check,
  Upload,
  MapPin,
  Sparkles,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  Lightbulb,
  Globe,
  Battery,
  Trash2,
  Shield,
  CheckCircle2,
  Info,
  X
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { cn } from './lib/utils';
import { getLojaWeather } from './services/weatherService';
import { WeatherData, SystemStatus, Event } from './types';
import { SYSTEM_METRICS_MOCK, MOCK_EVENTS } from './constants';
import { EventMap } from './components/mobile/EventMap';
import { analyzeEventPhoto } from './services/geminiService';
import LoginView, { UserProfile } from './components/LoginView';
import WeatherAlertOverlay from './components/WeatherAlertOverlay';
import EventDetailModal from './components/EventDetailModal';
import UploadPhotoView from './components/UploadPhotoView';

// Placeholder components - will be extracted to separate files later
const getIconUrl = (icon: string) => {
  // Visual Crossing icons names vs OpenWeatherMap URLs
  // For simplicity in this tech aesthetic, we can map some common ones or keep using OWM CDN if icon names match partially
  // VC icons: rain, snow, fog, wind, cloudy, partly-cloudy-day, partly-cloudy-night, clear-day, clear-night
  const mapping: Record<string, string> = {
    'rain': '10d',
    'snow': '13d',
    'fog': '50d',
    'wind': '50d',
    'cloudy': '04d',
    'partly-cloudy-day': '02d',
    'partly-cloudy-night': '02n',
    'clear-day': '01d',
    'clear-night': '01n'
  };
  const code = mapping[icon] || '03d';
  return `https://openweathermap.org/img/wn/${code}@4x.png`;
};

const ProfileView = ({ 
  className, 
  user, 
  onLogout,
  theme = 'dark',
  onUploadClick,
  onThemeToggle,
  isAdmin = false
}: { 
  className?: string; 
  user?: UserProfile; 
  onLogout?: () => void;
  key?: React.Key;
  theme?: 'dark' | 'light';
  onUploadClick?: () => void;
  onThemeToggle?: () => void;
  isAdmin?: boolean;
}) => {
  if (!user) return null;

  // Load custom base64 uploaded photos from localStorage
  const [customPhotos, setCustomPhotos] = React.useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('unl_user_uploads');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [notifsEnabled, setNotifsEnabled] = React.useState(true);

  // Default images from reference layout
  const defaultPhotos = [
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=400'
  ];

  const allPhotos = [...customPhotos, ...defaultPhotos];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className={cn("p-6 space-y-8 pb-32 max-w-md mx-auto relative text-center", className)}
    >
      {/* Profile Header Block matching reference */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative">
          {/* Circular avatar with thick white border + glowing soft shadow */}
          <div className={cn(
            "w-32 h-32 rounded-full border-[5px] overflow-hidden p-[1px] shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-colors duration-300 mx-auto",
            theme === 'light' ? "border-white bg-[#f8fafc]" : "border-zinc-900 bg-[#0d0d0d]"
          )}>
            <img 
              src={user.avatar} 
              className="w-full h-full object-cover rounded-full"
              alt={user.name}
            />
          </div>
          {/* Pulsing active green status badge exactly on bottom-right corner */}
          <span className="absolute bottom-2 right-2 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-4 border-white dark:border-[#0D0D0D]"></span>
          </span>
        </div>

        <div>
          {/* Matching typography for user identity */}
          <h2 className={cn(
            "text-[25px] font-black tracking-tight leading-none uppercase",
            theme === 'light' ? "text-zinc-900" : "text-white"
          )}>
            {user.name}
          </h2>
          <span className="text-zinc-500 font-medium text-xs tracking-wide block mt-1.5 font-mono">
            {user.email || `${user.name.toLowerCase().replace(/\s+/g, '.')}@unl.edu.cloud`}
          </span>
        </div>

        {/* Dynamic Badge Pills inside a row */}
        <div className="flex flex-wrap gap-2 justify-center pt-1">
          <span className="px-3 py-1 bg-indigo-50 dark:bg-zinc-800/80 text-[10px] font-bold text-indigo-650 dark:text-zinc-300 rounded-full border border-indigo-100/30 font-sans">
            {user.badge || "Investigador"}
          </span>
        </div>
      </div>

      {/* Grid of stats panel - 24 Events Attended & 142 Photos Shared, only for non-admin students */}
      {!isAdmin && (
        <div className={cn(
          "grid grid-cols-2 divide-x border-y py-5 transition-colors duration-300",
          theme === 'light' ? "border-zinc-200/80 bg-zinc-50/40 divide-zinc-200" : "border-[#222] bg-[#0A0A0A]/40 divide-[#222]"
        )}>
          <div className="text-center px-4">
            <p className={cn("text-2xl font-black font-mono tracking-tight", theme === 'light' ? "text-zinc-900" : "text-white")}>
              24
            </p>
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mt-1">
              Eventos Asistidos
            </p>
          </div>
          <div className="text-center px-4">
            <p className={cn("text-2xl font-black font-mono tracking-tight", theme === 'light' ? "text-zinc-900" : "text-white")}>
              {142 + customPhotos.length}
            </p>
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mt-1">
              Fotos Compartidas
            </p>
          </div>
        </div>
      )}

      {/* Administrative Info Card shown ONLY on Web Dashboard (isAdmin) */}
      {isAdmin && (
        <div className={cn(
          "border p-5 rounded-2xl text-left space-y-4 transition-colors duration-300",
          theme === 'light' ? "bg-zinc-50/50 border-zinc-200" : "bg-[#0d0d0d] border-zinc-850"
        )}>
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-150 dark:border-zinc-800">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#0F766E]">
              PANEL DE CONTROL ADMINISTRATIVO
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 font-bold uppercase tracking-wide">Rol / Acceso</span>
              <span className={cn("font-black uppercase tracking-tight", theme === 'light' ? "text-zinc-900" : "text-white")}>
                Directora General
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 font-bold uppercase tracking-wide">Sonda Local</span>
              <span className="font-mono bg-zinc-150 dark:bg-zinc-900/60 px-2 py-0.5 text-[10px] font-bold rounded border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-350">
                UNL-ALPHA
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 font-bold uppercase tracking-wide">Estado de Alertas</span>
              <span className="text-emerald-500 font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-1">
                ● En Línea (Sintonizado)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* My Uploads gallery section with "+" trigger block - only for non-admin students */}
      {!isAdmin && (
        <div className="space-y-4 text-left">
          <div className="flex justify-between items-center px-1">
            <h3 className={cn(
              "text-lg font-bold tracking-tight",
              theme === 'light' ? "text-zinc-900" : "text-white"
            )}>
              Mis Cargas
            </h3>
            <button 
              type="button" 
              onClick={onUploadClick}
              className="text-xs font-semibold text-[#0F766E] hover:text-[#0A524D] transition-colors flex items-center gap-1 cursor-pointer"
            >
              Ver Galería <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 2x2 grid of photo gallery */}
          <div className="grid grid-cols-2 gap-4">
            {/* Display first 3 photos with beautiful overlays */}
            {allPhotos.slice(0, 3).map((photoUrl, index) => (
              <div 
                key={index} 
                className={cn(
                  "relative aspect-square rounded-2xl overflow-hidden shadow-sm border group",
                  theme === 'light' ? "border-zinc-200 bg-zinc-100" : "border-zinc-850 bg-[#070707]"
                )}
              >
                <img 
                  src={photoUrl} 
                  referrerPolicy="no-referrer"
                  alt={`Carga ${index + 1}`} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <span className="text-[9px] font-black text-white uppercase tracking-wider">
                    Foto {index + 1}
                  </span>
                </div>
              </div>
            ))}

            {/* "+ Upload New" dashed grid button block */}
            <button
              type="button"
              onClick={onUploadClick}
              className={cn(
                "relative aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] cursor-pointer",
                theme === 'light' 
                  ? "border-zinc-300 hover:border-[#0F766E] hover:bg-zinc-50 bg-white" 
                  : "border-zinc-800 hover:border-[#0F766E] hover:bg-zinc-900/30 bg-[#0A0A0A]"
              )}
            >
              <div className="w-10 h-10 rounded-full bg-[#0F766E]/5 dark:bg-[#0F766E]/10 flex items-center justify-center mb-2">
                <Camera className="w-5 h-5 text-[#0F766E]" />
              </div>
              <span className={cn(
                "text-[11px] font-extrabold uppercase tracking-wider block",
                theme === 'light' ? "text-zinc-700" : "text-zinc-300"
              )}>
                Subir Nueva
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Account Settings Section inside custom list container */}
      <div className="space-y-2 text-left">
        <h3 className={cn(
          "text-[10px] font-black uppercase tracking-[0.3em] mb-4 transition-colors duration-300 px-1",
          theme === 'light' ? "text-zinc-500" : "text-zinc-650"
        )}>Ajustes de Cuenta</h3>
        {[
          { icon: Mail, label: 'Notificaciones', value: 'Activo', color: '[#0F766E]', action: undefined },
          { icon: History, label: 'Sincronización Histórica', value: '42.1 GB', color: theme === 'light' ? 'zinc-600' : 'zinc-400', action: undefined },
          { icon: Award, label: 'Insignia UNL', value: user.badge || 'Acreditado', color: '[#0F766E]', action: undefined },
          { icon: LogOut, label: 'Cerrar Sesión', value: 'Desconectar', color: 'red-500', action: onLogout },
        ].map((item, i) => (
          <button 
            key={i} 
            onClick={item.action}
            disabled={!item.action}
            className={cn(
              "w-full flex items-center justify-between p-4 border transition-colors group",
              theme === 'light' 
                ? "bg-white border-zinc-200 text-zinc-800" 
                : "bg-[#0D0D0D] border-[#222] text-white",
              item.action 
                ? (theme === 'light' 
                    ? "hover:bg-zinc-50 hover:border-[#0F766E] cursor-pointer text-left hover:shadow-sm" 
                    : "hover:bg-[#151515] hover:border-[#0F766E] cursor-pointer text-left") 
                : "cursor-default text-left"
            )}
            type="button"
          >
            <div className="flex items-center gap-4">
              <item.icon className={cn(
                "w-4 h-4 text-zinc-400 transition-colors",
                theme === 'light' ? "group-hover:text-[#0F766E]" : "group-hover:text-white"
              )} />
              <span className={cn(
                "text-xs font-bold uppercase tracking-tight transition-colors",
                theme === 'light' ? "text-zinc-800 group-hover:text-[#0F766E]" : "text-white group-hover:text-white"
              )}>{item.label}</span>
            </div>
            <span className={cn(
              "text-[9px] font-mono uppercase font-black", 
              item.color === '[#0F766E]' ? "text-[#0F766E]" : (item.color === 'red-500' ? "text-red-500" : (theme === 'light' ? "text-zinc-500" : "text-zinc-400"))
            )}>{item.value}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

const DashboardView = ({ 
  user, 
  onLogout, 
  onSelectEvent,
  events,
  onAddEvent,
  onDeleteEvent,
  theme = 'dark',
  onThemeToggle,
  onSwitchToMobile,
  showToast
}: { 
  user: UserProfile; 
  onLogout: () => void; 
  onSelectEvent: (event: Event) => void; 
  events: Event[];
  onAddEvent: (newEvent: Event) => void;
  onDeleteEvent?: (eventId: string) => void;
  theme?: 'dark' | 'light';
  onThemeToggle?: () => void;
  onSwitchToMobile?: () => void;
  showToast?: (message: string, type: 'success' | 'error' | 'info', title?: string) => void;
}) => {
  const [metrics, setMetrics] = useState<SystemStatus>(SYSTEM_METRICS_MOCK);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  
  // High fidelity Admin navigation tabs as shown in provided images
  const [adminTab, setAdminTab] = useState<'dashboard' | 'events' | 'sensors' | 'moderation' | 'analytics' | 'profile'>('dashboard');

  // Creation Form state (located inside the Events tab now)
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successNotif, setSuccessNotif] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<'festival' | 'concert' | 'fair' | 'cultural'>('festival');
  const [formLocationName, setFormLocationName] = useState('');
  const [formLat, setFormLat] = useState<number>(-3.9931);
  const [formLng, setFormLng] = useState<number>(-79.2041);
  const [formDate, setFormDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [formImgMode, setFormImgMode] = useState<'preset' | 'upload'>('preset');
  const [formPresetImg, setFormPresetImg] = useState('https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=1200');
  const [formCustomBase64, setFormCustomBase64] = useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const PRESET_IMAGES = [
    { name: 'Arte y Teatro', url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=1200' },
    { name: 'Feria Exposición', url: 'https://images.unsplash.com/photo-1472653431158-6364773b2a56?auto=format&fit=crop&q=80&w=1200' },
    { name: 'Concierto / Música', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=1200' },
    { name: 'Murales y Academia', url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=1200' }
  ];

  // Stateful administrative node data (Sensors Tab)
  const [sensors, setSensors] = useState([
    { id: 'ESP32-Node-01', status: 'Online', temp: 24.2, hum: 48, batt: 92, type: 'IOT SENSOR', signal: 'Fuerte' },
    { id: 'ESP32-Node-02', status: 'Online', temp: 21.5, hum: 52, batt: 45, type: 'API FALLBACK', signal: 'Media' },
    { id: 'ESP32-Node-03', status: 'Offline', temp: null, hum: null, batt: 0, type: 'IOT SENSOR', signal: 'Nula' }
  ]);

  // Terminal Simulator State
  const [sensorLogs, setSensorLogs] = useState<string[]>([]);
  const [logNode, setLogNode] = useState<string | null>(null);

  // Content Moderation Queue State
  const [pendingMedia, setPendingMedia] = useState([
    { id: 'm1', studentName: 'Jordan Smith', studentId: '48291', eventName: 'Hackathon UNL 2026', time: 'Hace 12 min', likes: 128, dislikes: 2, badge: 'REVISIÓN REQUERIDA', image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=400' },
    { id: 'm2', studentName: 'Emily Chen', studentId: '59310', eventName: 'Expo Diseño', time: 'Hace 45 min', likes: 45, dislikes: 0, badge: 'REVISIÓN REQUERIDA', image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=400' },
    { id: 'm3', studentName: 'Alex Rodriguez', studentId: '31204', eventName: 'Finales Deportivas UNL', time: 'Hace 2 horas', likes: 2100, dislikes: 12, badge: 'REVISIÓN REQUERIDA', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=400' },
    { id: 'm4', studentName: 'Marcus T.', studentId: '77201', eventName: 'Simposio Ingeniería', time: 'Hace 4 horas', likes: 89, dislikes: 1, badge: 'REVISIÓN REQUERIDA', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=400' }
  ]);
  const [selectedModerationItems, setSelectedModerationItems] = useState<string[]>([]);

  const isAdmin = user.name.toLowerCase().includes('isabel') || user.email?.toLowerCase().includes('isabel');

  // Participant States for IoT Simulation
  const [participantTemp, setParticipantTemp] = useState(21.4);
  const [participantHum, setParticipantHum] = useState(54);
  const [participantLogs, setParticipantLogs] = useState<string[]>([
    `[SISTEMA] Iniciando sonda individual ${user.node || 'node-unl-pionero'}...`,
    `[SENSORES] DHT22 calibrado correctamente. Estado de sintonía: OK.`,
    `[RED] Enlace establecido con el clúster central (Loja-EC).`,
    `[STREAM] Esperando comandos de transmisión de telemetría...`
  ]);
  const [simulatedTransmissions, setSimulatedTransmissions] = useState(4);

  // Admin Account Settings Form
  const [adminName, setAdminName] = useState(user.name);
  const [adminEmail, setAdminEmail] = useState(user.email || 'isabel.m@unl.edu.ec');
  const [adminRole, setAdminRole] = useState(isAdmin ? 'Directora General' : (user.role || 'Participante de Red'));
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);

  useEffect(() => {
    getLojaWeather().then(setWeather);
  }, []);

  // Handle sensor reboots
  const handleRebootNode = (nodeId: string) => {
    setSensors(prev => prev.map(s => s.id === nodeId ? { ...s, status: 'Reiniciando...' } : s));
    showToast?.(`Ejecutando reinicio físico en ${nodeId}...`, 'info', 'Reiniciando Nodo');
    setTimeout(() => {
      setSensors(prev => prev.map(s => s.id === nodeId ? { ...s, status: 'Online' } : s));
      showToast?.(`Handshake completado. Sonda ${nodeId} operando normalmente.`, 'success', 'Sintonizado Exitoso');
    }, 2000);
  };

  // View interactive scrolling terminal logs for each node
  const handleOpenLogs = (nodeId: string) => {
    setLogNode(nodeId);
    showToast?.(`Transmitiendo logs de telemetría de ${nodeId}`, 'info', 'Enlace Establecido');
    setSensorLogs([
      `[HANDSHAKE] Estableciendo conexión cifrada con ${nodeId}...`,
      `[AUTH] Credenciales validadas. Nivel: ADMINISTRADOR. OK.`,
      `[NODE] Leyendo registros del sensor local micro-ESP32...`,
      `[SYS] Batería integrada en reposo: 3.9 V. Sintonizado de señal: Óptimo.`,
      `[STATS] Temperatura procesada en puerto analógico: 22.4°C`,
      `[STATS] Humedad relativa: 51.5%`,
      `[SYS] Transmisión exitosa al clúster satelital UNL. Latencia actual: 18ms.`,
      `[STREAM] Escuchando activamente tramas entrantes...`
    ]);
  };

  // Bulk actions for content moderation
  const handleToggleSelectMedia = (mediaId: string) => {
    setSelectedModerationItems(prev => 
      prev.includes(mediaId) ? prev.filter(id => id !== mediaId) : [...prev, mediaId]
    );
  };

  const handleApproveSelected = () => {
    const qty = selectedModerationItems.length;
    setPendingMedia(prev => prev.filter(item => !selectedModerationItems.includes(item.id)));
    setSelectedModerationItems([]);
    showToast?.(`Se han homologado ${qty} imágenes para publicación en lotes.`, 'success', 'Moderación UNL');
  };

  const handleApproveSingle = (mediaId: string) => {
    const item = pendingMedia.find(m => m.id === mediaId);
    setPendingMedia(prev => prev.filter(item => item.id !== mediaId));
    setSelectedModerationItems(prev => prev.filter(id => id !== mediaId));
    showToast?.(`Foto de ${item?.studentName || 'Estudiante'} aprobada correctamente.`, 'success', 'Galería Pública');
  };

  const handleRejectSingle = (mediaId: string) => {
    const item = pendingMedia.find(m => m.id === mediaId);
    setPendingMedia(prev => prev.filter(item => item.id !== mediaId));
    setSelectedModerationItems(prev => prev.filter(id => id !== mediaId));
    showToast?.(`Foto de ${item?.studentName || 'Estudiante'} rechazada por incumplir directivas.`, 'error', 'Galería Pública');
  };

  const handleSaveProfileSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    showToast?.("Iniciando handshake para resguardar perfil...", "info", "Ajustes del Sistema");
    setTimeout(() => {
      setProfileSaving(false);
      setProfileSavedMsg(true);
      user.name = adminName;
      user.email = adminEmail;
      showToast?.("Identidad conservada y sincronizada con el nodo central.", "success", "Sincronización Exitosa");
      setTimeout(() => setProfileSavedMsg(false), 3000);
    }, 1200);
  };

  const chartData = Array.from({ length: 18 }, (_, i) => ({
    time: `${i + 6}:00`,
    value: 12 + Math.floor(Math.sin(i / 3) * 10 + 20) + Math.random() * 8
  }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setFormError("El archivo debe ser una imagen (JPG, PNG, WEBP).");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setFormError("La imagen debe pesar un máximo de 2 MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormCustomBase64(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRandomizeCoords = () => {
    const randomOffsetLat = (Math.random() - 0.5) * 0.02;
    const randomOffsetLng = (Math.random() - 0.5) * 0.02;
    setFormLat(Number((-3.9931 + randomOffsetLat).toFixed(4)));
    setFormLng(Number((-79.2042 + randomOffsetLng).toFixed(4)));
  };

  const handleCreateEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formTitle.trim()) {
      setFormError("El título de la sonda de evento es requerido.");
      return;
    }
    if (!formLocationName.trim()) {
      setFormError("El o los lugares asignados son requeridos.");
      return;
    }
    if (!formDescription.trim()) {
      setFormError("La descripción es requerida.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const parsedLat = Number(formLat) || -3.9931;
      const parsedLng = Number(formLng) || -79.2041;

      const finalEvent: Event = {
        id: `node-event-${Date.now()}`,
        title: formTitle,
        description: formDescription,
        category: formCategory,
        location: {
          lat: parsedLat,
          lng: parsedLng,
          name: formLocationName
        },
        date: formDate,
        attendeesCount: Math.floor(150 + Math.random() * 900),
        imageUrl: formImgMode === 'upload' && formCustomBase64 ? formCustomBase64 : formPresetImg
      };

      onAddEvent(finalEvent);

      setSuccessNotif(`Sonda de evento registrada en el clúster central.`);
      setIsSubmitting(false);

      setFormTitle('');
      setFormDescription('');
      setFormCategory('festival');
      setFormLocationName('');
      setFormLat(-3.9931);
      setFormLng(-79.2041);
      setFormDate(new Date().toISOString().split('T')[0]);
      setFormImgMode('preset');
      setFormPresetImg(PRESET_IMAGES[0].url);
      setFormCustomBase64(null);

      setTimeout(() => {
        setSuccessNotif(null);
        setShowCreateForm(false);
      }, 2000);

    }, 1000);
  };

  return (
    <div className={cn(
      "flex h-screen font-sans overflow-hidden transition-colors duration-300",
      theme === 'light' 
        ? "bg-zinc-50 text-zinc-900" 
        : "bg-black text-white"
    )}>
      
      {/* 1. LEFT SIDEBAR (Exactly matching the style, alignment and contents of image examples) */}
      <aside className={cn(
        "w-72 flex-shrink-0 flex flex-col border-r h-full transition-colors duration-300 relative z-40",
        theme === 'light' 
          ? "bg-white border-zinc-200" 
          : "bg-[#090909] border-zinc-850"
      )}>
        {/* Branding Title Block & Decorative Node Line */}
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none flex items-center justify-center p-0.5 shadow-lg bg-white overflow-hidden">
              <img src={logoImg} alt="UNL Cloud Connect" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className={cn("text-xl font-black tracking-tighter uppercase leading-none", theme === 'light' ? "text-zinc-900" : "text-white")}>
                UNL<span className="text-[#0F766E]">-CLOUD</span>
              </h2>
              <span className="text-[8px] uppercase tracking-[0.3em] font-extrabold text-zinc-500 block">Console {isAdmin ? "Admin" : "Participante"}</span>
            </div>
          </div>
          <div className="h-[2px] w-full bg-[#0F766E]/20 mt-6" />
        </div>

        {/* Real-Time Authenticated Admin Profile Section */}
        <div className="px-6 py-4 flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-[#0F766E] p-[2px] overflow-hidden bg-black/40">
              <img 
                src={user.avatar} 
                className="w-full h-full object-cover rounded-full" 
                alt="Isabel Maldonado" 
              />
            </div>
            {/* Online Pulse Indicator */}
            <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-black"></span>
            </span>
          </div>
          <div className="min-w-0">
            <p className={cn("text-sm font-black uppercase tracking-tight truncate", theme === 'light' ? "text-zinc-800" : "text-white")}>
              {adminName}
            </p>
            <p className="text-[9px] font-mono text-zinc-500 truncate block mt-0.5 uppercase tracking-wider font-semibold">
              {adminRole}
            </p>
          </div>
        </div>

        <div className="h-[1px] w-full bg-zinc-200 dark:bg-zinc-900/50 mb-4 px-6" />

        {/* Dynamic Navigation Rails */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
          {(isAdmin ? [
            { id: 'dashboard', label: 'Consola Admin', icon: BarChart3, badge: null },
            { id: 'events', label: 'Eventos UNL', icon: Calendar, badge: events.length.toString() },
            { id: 'sensors', label: 'Sensores IoT', icon: Wifi, badge: 'STABLE' },
            { id: 'moderation', label: 'Moderación', icon: Layers, badge: pendingMedia.length > 0 ? pendingMedia.length.toString() : null },
            { id: 'analytics', label: 'Analiticas Clima', icon: Activity, badge: null },
            { id: 'profile', label: 'Configuración', icon: User, badge: null }
          ] : [
            { id: 'dashboard', label: 'Mi Dashboard', icon: BarChart3, badge: 'PIONERO' },
            { id: 'events', label: 'Mis Eventos', icon: Calendar, badge: events.length.toString() },
            { id: 'sensors', label: 'Sonda IoT', icon: Wifi, badge: 'VIRTUAL' },
            { id: 'analytics', label: 'Métricas Clima', icon: Activity, badge: null },
            { id: 'profile', label: 'Mi Perfil', icon: User, badge: null }
          ]).map((tab) => {
            const IconComp = tab.icon;
            const isActive = adminTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id as any)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 text-xs font-black uppercase tracking-wider border rounded-none transition-all duration-300 group select-none",
                  isActive
                    ? "bg-[#0F766E] border-[#0F766E] text-white"
                    : theme === 'light'
                      ? "bg-transparent border-transparent text-zinc-650 hover:bg-zinc-100 hover:text-zinc-900 hover:border-zinc-205"
                      : "bg-transparent border-transparent text-zinc-400 hover:bg-neutral-900 hover:text-white hover:border-zinc-800"
                )}
                type="button"
              >
                <div className="flex items-center gap-3.5">
                  <IconComp className={cn(
                    "w-4 h-4 transition-colors",
                    isActive 
                      ? "text-white" 
                      : (theme === 'light' ? "text-zinc-405 group-hover:text-[#0F766E]" : "text-zinc-550 group-hover:text-[#0F766E]")
                  )} />
                  <span className={cn(isActive ? "font-black" : "font-bold")}>{tab.label}</span>
                </div>
                {tab.badge && (
                  <span className={cn(
                    "text-[8px] font-mono px-2 py-0.5 font-bold rounded-none",
                    isActive
                      ? "bg-white text-[#0F766E]"
                      : theme === 'light'
                        ? "bg-zinc-100 text-zinc-600 border border-zinc-200"
                        : "bg-zinc-950 text-blue-400 border border-zinc-900"
                  )}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Controls Block - Theme & View Switchers */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-90 w-full space-y-3 bg-zinc-500/5">
          <div className="space-y-1.5">
            <span className="text-[8px] font-mono tracking-widest uppercase text-zinc-400 dark:text-zinc-500 block">Personalización de Tema</span>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => {
                  if (theme !== 'light') {
                    onThemeToggle?.();
                    showToast?.("Tema Claro activo en la consola", "info", "Ajustes");
                  }
                }}
                className={cn(
                  "py-1.5 text-[8.5px] font-mono font-black uppercase tracking-wider border rounded-none flex items-center justify-center gap-1.5 transition-all select-none cursor-pointer",
                  theme === 'light' 
                    ? "bg-[#0F766E]/10 border-[#0F766E] text-[#0F766E]" 
                    : "border-zinc-800 text-zinc-400 hover:border-zinc-650 hover:text-white"
                )}
                type="button"
              >
                <Sun className="w-3.5 h-3.5 animate-spin-slow" />
                Claro
              </button>
              <button 
                onClick={() => {
                  if (theme !== 'dark') {
                    onThemeToggle?.();
                    showToast?.("Tema Oscuro activo en la consola", "info", "Ajustes");
                  }
                }}
                className={cn(
                  "py-1.5 text-[8.5px] font-mono font-black uppercase tracking-wider border rounded-none flex items-center justify-center gap-1.5 transition-all select-none cursor-pointer",
                  theme === 'dark' 
                    ? "bg-[#0F766E]/15 border-[#0F766E] text-[#0F766E]" 
                    : "border-zinc-200 text-zinc-650 hover:border-zinc-400 hover:text-zinc-900"
                )}
                type="button"
              >
                <Moon className="w-3.5 h-3.5" />
                Oscuro
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[8px] font-mono tracking-widest uppercase text-zinc-400 dark:text-zinc-500 block">Vista de Consola</span>
            <div className="grid grid-cols-2 gap-2">
              <button 
                className="py-1.5 text-[8.5px] font-mono font-black uppercase tracking-wider border rounded-none bg-[#0F766E] border-[#0F766E] text-white duration-300 pointer-events-none select-none"
                type="button"
              >
                Escritorio
              </button>
              <button 
                onClick={onSwitchToMobile}
                className={cn(
                  "py-1.5 text-[8.5px] font-mono font-black uppercase tracking-wider border rounded-none transition-all cursor-pointer",
                  theme === 'light' 
                    ? "border-zinc-200 text-zinc-650 hover:bg-zinc-100/50 hover:border-zinc-400" 
                    : "border-zinc-800 text-zinc-400 hover:bg-neutral-900 hover:border-zinc-650 hover:text-white"
                )}
                type="button"
              >
                Móvil
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Footer Logout Block */}
        <div className="p-6">
          <button
            onClick={onLogout}
            className={cn(
              "w-full flex items-center justify-center gap-3 py-3 border text-[10px] font-black uppercase tracking-widest transition-all",
              theme === 'light'
                ? "bg-zinc-100 border-zinc-250 text-red-500 hover:bg-red-50 hover:border-red-500/50"
                : "bg-neutral-950/40 border-zinc-850 text-red-400 hover:bg-[#0F766E]/10 hover:border-[#0F766E]/40"
            )}
            type="button"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* 2. MAIN ADMIN WORKSPACE WORK AREA RIGHT SIDE PANEL */}
      <div className="flex-1 flex flex-col overflow-hidden h-full">

        {/* Global Area Top Bar */}
        <header className={cn(
          "h-20 border-b flex items-center justify-between px-8 transition-colors duration-300",
          theme === 'light' ? "bg-white border-zinc-200" : "bg-[#090909] border-zinc-850"
        )}>
          {/* Section Dynamic Context title */}
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono bg-[#0F766E]/15 text-[#0F766E] border border-[#0F766E]/30 px-3 py-1 font-bold tracking-widest uppercase">
              {adminTab} view
            </span>
            <div className="hidden sm:flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                Red central unl integrada
              </span>
            </div>
          </div>

          {/* Quick Stats Panel Area */}
          <div className="flex items-center gap-8">
            <div className="hidden md:block text-right">
              <p className="text-[9px] uppercase tracking-widest text-zinc-500">Clima UNL Loja</p>
              <p className="text-lg font-mono text-[#0F766E] font-black">
                {weather?.temp.toFixed(1)}°C <span className="text-[9px] font-bold text-zinc-550 lowercase">estable</span>
              </p>
            </div>
            <div className={cn("hidden lg:block text-right border-l pl-8", theme === 'light' ? "border-zinc-200" : "border-zinc-800")}>
              <p className="text-[9px] uppercase tracking-widest text-zinc-500">Estado Servidor</p>
              <p className={cn("text-lg font-mono font-black", theme === 'light' ? "text-zinc-900" : "text-white")}>
                {metrics.pingMs}ms <span className="text-[9px] font-bold text-[#0F766E] uppercase ml-1">Sincronizado</span>
              </p>
            </div>
          </div>
        </header>

        {/* Main Content Workspace Container Content Switching */}
        <main className="flex-1 overflow-y-auto p-8 pr-6 custom-scrollbar">
          
          <AnimatePresence mode="wait">
            {/* TAB: DASHBOARD OVERVIEW */}
            {adminTab === 'dashboard' && (
              isAdmin ? (
                <motion.div
                  key="tab-dashboard"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="space-y-8"
                >
                  {/* 4 Multi-Stat cards top row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Eventos Totales', value: (1284 + events.length).toLocaleString(), tag: '+12% este mes', desc: 'Sincronizados en clúster', icon: Calendar },
                      { label: 'Eventos Activos', value: '42', tag: 'En Tiempo Real', desc: 'Transmitiendo microdatos', icon: Activity },
                      { label: 'Sondas en Línea', value: '942', tag: '98.2% Uptime', desc: 'Nodos mesh activos', icon: Wifi },
                      { label: 'Estudiantes UNL', value: '15,402', tag: 'Acreditados', desc: 'Usuarios registrados', icon: User }
                    ].map((stat, idx) => (
                      <div 
                        key={idx} 
                        className={cn(
                          "p-6 border flex flex-col justify-between transition-all duration-300 relative overflow-hidden group hover:scale-[1.01]",
                          theme === 'light' ? "bg-white border-zinc-200 shadow-sm" : "bg-[#0c0c0c] border-zinc-850"
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                            {stat.label}
                          </span>
                          <stat.icon className="w-5 h-5 text-[#0F766E]" />
                        </div>
                        <div className="mt-4 space-y-1">
                          <div className="text-3xl font-mono font-black tracking-tighter text-[#0F766E]">
                            {stat.value}
                          </div>
                          <div className="flex items-center justify-between text-[9px] font-mono text-zinc-550 pt-1.5 border-t border-zinc-200 dark:border-zinc-850">
                            <span className="text-zinc-400 font-bold uppercase">{stat.desc}</span>
                            <span className="font-extrabold text-[#0F766E]">{stat.tag}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Dashboard Inner Workspace */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Climate Trends Column area */}
                    <div className={cn(
                      "lg:col-span-2 p-8 border flex flex-col h-[420px] justify-between relative",
                      theme === 'light' ? "bg-white border-zinc-200 shadow-sm" : "bg-[#0c0c0c] border-[#17171d] border-zinc-850"
                    )}>
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className={cn("text-lg font-black tracking-tight uppercase italic", theme === 'light' ? "text-zinc-900" : "text-white")}>
                            Frecuencia Climática UNL
                          </h3>
                          <p className="text-[9px] text-[#0F766E] font-bold uppercase tracking-widest mt-1">
                            Telemetría de Red Mesh de Sondas
                          </p>
                        </div>
                        <div className={cn("flex p-0.5 border text-[9px]", theme === 'light' ? "bg-zinc-50 border-zinc-250" : "bg-black border-zinc-850")}>
                          <button className="px-3 py-1 bg-[#0F766E] text-white font-black uppercase">Día</button>
                          <button className="px-3 py-1 text-zinc-500 font-bold uppercase hover:text-white">Semana</button>
                        </div>
                      </div>

                      <div className="flex-1 h-full min-h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'light' ? "#efefef" : "#171717"} />
                            <XAxis 
                              dataKey="time" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 9, fill: theme === 'light' ? '#71717a' : '#555', fontWeight: 600, fontFamily: 'monospace' }}
                            />
                            <YAxis hide />
                            <Tooltip 
                              cursor={{ fill: theme === 'light' ? '#fafafa' : '#111' }}
                              contentStyle={{ 
                                backgroundColor: theme === 'light' ? '#fff' : '#000', 
                                border: '1px solid #0F766E', 
                                color: theme === 'light' ? '#000' : '#fff',
                                fontSize: '9px',
                                fontFamily: 'monospace'
                              }}
                            />
                            <Bar dataKey="value" radius={[2, 2, 0, 0]} barSize={28}>
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#0F766E' : (theme === 'light' ? '#cbd5e1' : '#222')} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Recent Activity panel right column */}
                    <div className={cn(
                      "p-8 border flex flex-col justify-between h-[420px]",
                      theme === 'light' ? "bg-white border-zinc-200" : "bg-[#0c0c0c] border-[#17171d] border-zinc-850"
                    )}>
                      <div className="border-b pb-4 border-zinc-200 dark:border-zinc-850">
                        <h3 className={cn("text-xs font-black tracking-wider uppercase flex items-center gap-2", theme === 'light' ? "text-zinc-800" : "text-zinc-200")}>
                          <Clock className="w-3.5 h-3.5 text-[#0F766E]" /> Actividad del Sistema
                        </h3>
                        <p className="text-[8px] text-zinc-550 block mt-1 uppercase">Sincronizador Automático</p>
                      </div>

                      <div className="flex-1 overflow-y-auto py-4 space-y-4 custom-scrollbar select-none">
                        {[
                          { title: 'Temperatura elevada en Lab 304', node: 'Node #9421', time: 'hace 2 min', type: 'error' },
                          { title: 'Nueva curadora approved', node: 'Maldonado.I', time: 'hace 15 min', type: 'info' },
                          { title: 'Push de Firmware a Gateway-North', node: 'Scheduled', time: 'hace 1 hora', type: 'success' },
                          { title: 'Seminario IoT: 450 logins', node: 'Event Cloud', time: 'hace 3 horas', type: 'info' },
                          { title: 'Sonda 12B en estado stand-by', node: 'Maintenance', time: 'hace 4 horas', type: 'warn' }
                        ].map((act, i) => (
                          <div key={i} className="flex flex-col text-xs leading-normal">
                            <span className={cn(
                              "font-extrabold uppercase text-[9.5px]",
                              theme === 'light' ? "text-zinc-800" : "text-zinc-200"
                            )}>{act.title}</span>
                            <div className="flex items-center gap-2 text-[8px] font-mono mt-1 text-zinc-500">
                              <span className="uppercase">{act.time}</span>
                              <span>•</span>
                              <span className="font-bold text-[#0F766E]">{act.node}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button 
                        onClick={() => setAdminTab('sensors')}
                        className={cn(
                          "w-full text-center py-2.5 text-[8.5px] font-mono font-black uppercase tracking-widest border transition-colors cursor-pointer",
                          theme === 'light' ? "bg-zinc-50 text-zinc-650 hover:bg-zinc-100 border-zinc-200" : "bg-[#111] hover:bg-neutral-900 border-zinc-850 text-[#0F766E]"
                        )}
                      >
                        Verificar Servidores IoT
                      </button>
                    </div>
                  </div>

                  {/* Sub-block distribution mock */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className={cn(
                      "p-6 border md:col-span-2 flex flex-col justify-between min-h-[200px]",
                      theme === 'light' ? "bg-white border-zinc-200 shadow-sm" : "bg-[#0c0c0c] border-[#17171d] border-zinc-850"
                    )}>
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-[#0F766E]">
                          Topología de Sondas UNL (Mapa Conceptual)
                        </h4>
                        <p className="text-xs text-zinc-550 mt-1">Representación gráfica del campus de Loja y la central de recepción de tramas atmosféricas.</p>
                      </div>
                      {/* Visual schematic of map */}
                      <div className="my-4 h-24 border border-zinc-700/50 flex flex-wrap items-center justify-around p-3 relative bg-black/5">
                        <div className="absolute inset-0 bg-radial-gradient from-[#0F766E]/5 to-transparent opacity-80 pointer-events-none" />
                        {['Alpha-Primary (Central)', 'Beta-Lab 102', 'Gamma-Zootecnia', 'Delta-Biblioteca'].map((lbl, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 p-1 border border-zinc-800/80 bg-black/60 text-[7px] font-mono text-zinc-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            <span>{lbl}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-mono text-zinc-500 uppercase">Agrupador: Clúster UNL Loja</span>
                        <button 
                          onClick={() => setAdminTab('sensors')}
                          className="text-[8.5px] font-mono font-black text-[#0F766E] uppercase hover:underline"
                        >
                          [Escanear Sondas]
                        </button>
                      </div>
                    </div>

                    {/* Cloud Status right card */}
                    <div className={cn(
                      "p-6 border flex flex-col justify-between min-h-[200px]",
                      theme === 'light' ? "bg-white border-zinc-200" : "bg-[#0c0c0c] border-[#17171d] border-zinc-850"
                    )}>
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Metatrama de Servidores</h4>
                        <p className="text-xs text-zinc-550 mt-1 font-sans">Espacio total de las imágenes y telemetría de estudiantes.</p>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-[8px] font-mono text-zinc-400 mb-1">
                            <span>ALMACENAMIENTO DE RECURSOS</span>
                            <span className="font-bold text-white">68% Lleno</span>
                          </div>
                          <div className="w-full h-1.5 bg-zinc-800 rounded-none overflow-hidden">
                            <div className="w-[68%] h-full bg-[#0F766E]" />
                          </div>
                        </div>
                        <div className="flex justify-between text-[9px] font-mono">
                          <span className="text-zinc-500 uppercase">Latencia Base API:</span>
                          <span className="text-blue-500 font-extrabold">24 ms</span>
                        </div>
                      </div>
                      <div className="text-[7.5px] font-mono text-zinc-500 border-t border-zinc-250 dark:border-zinc-850 pt-2 uppercase">
                        Servicios en línea distribuidos
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="tab-participant-dashboard"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="space-y-8"
                >
                  {/* Sondas de Eventos Activas (Full Width table representing events) */}
                  <div className={cn(
                    "p-8 border flex flex-col min-h-[440px] justify-between relative rounded-none text-left",
                    theme === 'light' ? "bg-white border-zinc-200 shadow-sm" : "bg-[#0c0c0c] border-[#17171d] border-zinc-850"
                  )}>
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className={cn("text-lg font-black tracking-tight uppercase italic", theme === 'light' ? "text-zinc-900" : "text-white")}>
                          Mis Eventos
                        </h3>
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse mt-1.5" />
                      </div>
                      <p className="text-[9px] text-[#0F766E] font-bold uppercase tracking-widest mb-6 font-mono">
                        Participando en la red central de tramas IoT - Loja
                      </p>

                      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-850">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className={cn(
                              "border-b border-zinc-200 dark:border-zinc-850 text-[9px] font-mono text-zinc-500 uppercase font-black tracking-wider",
                              theme === 'light' ? "bg-zinc-50" : "bg-black/40"
                            )}>
                              <th className="p-3">Sonda / Evento</th>
                              <th className="p-3 col-span-2">Ubicación</th>
                              <th className="p-3">Categoría</th>
                              <th className="p-3">Fecha</th>
                              <th className="p-3 text-right">Afluencia</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-850">
                            {events.map((event) => (
                              <tr 
                                key={event.id}
                                onClick={() => onSelectEvent(event)}
                                className={cn(
                                  "text-[11px] transition-colors cursor-pointer group",
                                  theme === 'light' ? "hover:bg-zinc-50" : "hover:bg-white/5"
                                )}
                              >
                                <td className="p-3 flex items-center gap-2">
                                  <div className="w-8 h-8 overflow-hidden flex-shrink-0 bg-zinc-950 border border-zinc-800">
                                    <img src={event.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" alt={event.title} />
                                  </div>
                                  <span className={cn("font-black uppercase tracking-tight text-[11px]", theme === 'light' ? "text-zinc-800" : "text-zinc-250")}>
                                    {event.title}
                                  </span>
                                </td>
                                <td className="p-3 font-mono text-[9px] text-zinc-550 max-w-[120px] truncate uppercase">
                                  {event.location.name}
                                </td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 text-[8px] font-mono tracking-widest bg-[#0F766E]/15 border border-[#0F766E]/30 text-[#0F766E] font-black uppercase">
                                    {event.category}
                                  </span>
                                </td>
                                <td className="p-3 font-mono text-[10px] text-zinc-550">
                                  {event.date}
                                </td>
                                <td className="p-3 font-mono text-right font-black text-[#0F766E]">
                                  {event.attendeesCount}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="p-3 border-t border-zinc-100 dark:border-zinc-850/40 flex justify-between items-center text-[9px] font-mono text-zinc-500 uppercase font-black mt-4">
                      <span>Canales activos: {events.length}</span>
                      <span className="text-[#0F766E]">Sincronización OK</span>
                    </div>
                  </div>
                </motion.div>
              )
            )}

            {/* TAB: EVENT MANAGEMENT */}
            {adminTab === 'events' && (
              isAdmin ? (
                <motion.div
                  key="tab-events"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-6"
                >
                {/* 4 Multi-Stat row for Events */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Eventos Campus', value: events.length, sub: 'Registros activos' },
                    { label: 'Afluencia Estimada', value: events.reduce((acc, ev) => acc + ev.attendeesCount, 0).toLocaleString(), sub: 'Estudiantes UNL' },
                    { label: 'Alertas de Sondas', value: '04', sub: 'Requieren atención' },
                    { label: 'Uso red IoT', value: '84%', sub: 'Capacidad asignada' }
                  ].map((stat, i) => (
                    <div key={i} className={cn("p-5 border flex flex-col justify-between", theme === 'light' ? "bg-white border-zinc-200" : "bg-[#0c0c0c] border-zinc-850")}>
                      <span className="text-[8px] font-black uppercase tracking-wider text-zinc-500">{stat.label}</span>
                      <div className="mt-2 text-2xl font-mono font-black text-[#0F766E]">{stat.value}</div>
                      <span className="text-[7.5px] font-mono text-zinc-500 mt-1 uppercase block">{stat.sub}</span>
                    </div>
                  ))}
                </div>

                {/* Subheader and Toggle actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-850 pb-4">
                  <div>
                    <h3 className={cn("text-lg font-black tracking-tight uppercase italic", theme === 'light' ? "text-zinc-900" : "text-white")}>
                      Sondas de Eventos Activas
                    </h3>
                    <p className="text-xs text-zinc-500">Consola de administración e inicialización de tramas de recopilación IoT.</p>
                  </div>
                  <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="bg-[#0F766E] text-white hover:bg-neutral-900 hover:text-[#0F766E] font-black text-xs uppercase tracking-widest px-6 py-3 border border-transparent hover:border-[#0F766E] transition-all flex items-center gap-2"
                  >
                    {showCreateForm ? 'Cerrar Registro' : 'Nueva Sonda de Evento'}
                  </button>
                </div>

                {/* Event Creation Form Block (Expandable) */}
                {showCreateForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "p-6 border overflow-hidden",
                      theme === 'light' ? "bg-zinc-50 border-zinc-250" : "bg-[#0b0b0b] border-zinc-850"
                    )}
                  >
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#0F766E] mb-4">
                      Ingreso de Sonda de Evento / Inicializar Captura IoT
                    </h4>
                    <form onSubmit={handleCreateEventSubmit} className="space-y-4">
                      {successNotif ? (
                        <div className="border border-emerald-500/40 bg-emerald-500/5 p-6 text-center space-y-2">
                          <Check className="w-10 h-10 text-emerald-500 mx-auto animate-bounce" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">REGISTRADA CORRECTAMENTE</h4>
                          <p className="text-[10px] font-mono text-emerald-250/80 uppercase">{successNotif}</p>
                        </div>
                      ) : (
                        <>
                          {formError && (
                            <div className="border border-[#0F766E]/40 bg-[#0F766E]/5 p-3 flex gap-2 items-center text-[10px] font-mono font-bold uppercase text-[#0F766E]">
                              <AlertCircle className="w-4 h-4 flex-shrink-0" />
                              <span>{formError}</span>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase tracking-wider text-zinc-400">Título / Nombre del Evento *</label>
                              <input 
                                type="text"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                placeholder="Ej: Hackathon UNL 2026"
                                className={cn(
                                  "w-full text-[10px] p-3 font-mono border bg-transparent focus:outline-none focus:border-[#0F766E] transition-colors rounded-none",
                                  theme === 'light' ? "border-zinc-300 text-zinc-900 bg-white" : "border-zinc-800 text-white bg-black/45"
                                )}
                                required
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[8px] font-black uppercase tracking-wider text-zinc-400">Categoría *</label>
                                <select
                                  value={formCategory}
                                  onChange={(e) => setFormCategory(e.target.value as any)}
                                  className={cn(
                                    "w-full text-[10px] p-3 font-mono border bg-transparent focus:outline-none focus:border-[#0F766E] transition-colors rounded-none",
                                    theme === 'light' ? "border-zinc-300 text-zinc-900 bg-white" : "border-zinc-800 bg-zinc-950 text-white"
                                  )}
                                >
                                  <option value="festival">Festival</option>
                                  <option value="concert">Concierto</option>
                                  <option value="fair">Feria</option>
                                  <option value="cultural">Cultural</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] font-black uppercase tracking-wider text-zinc-400">Fecha *</label>
                                <input 
                                  type="date"
                                  value={formDate}
                                  onChange={(e) => setFormDate(e.target.value)}
                                  className={cn(
                                    "w-full text-[10px] p-3 font-mono border bg-transparent focus:outline-none focus:border-[#0F766E] transition-colors rounded-none",
                                    theme === 'light' ? "border-zinc-300 text-zinc-900 bg-white" : "border-zinc-800 bg-black text-white"
                                  )}
                                  required
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase tracking-wider text-zinc-400">Ubicación / Lugares asignados *</label>
                              <input 
                                type="text"
                                value={formLocationName}
                                onChange={(e) => setFormLocationName(e.target.value)}
                                placeholder="Ej: Plaza Central, Edificio Administración UNL"
                                className={cn(
                                  "w-full text-[10px] p-3 font-mono border bg-transparent focus:outline-none focus:border-[#0F766E] transition-colors rounded-none",
                                  theme === 'light' ? "border-zinc-300 text-zinc-900 bg-white" : "border-zinc-800 text-white bg-black/45"
                                )}
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between items-center mb-0.5">
                                <label className="text-[8px] font-black uppercase tracking-wider text-zinc-400">Coordenadas del Sensor UNL *</label>
                                <button 
                                  type="button" 
                                  onClick={handleRandomizeCoords}
                                  className="text-[8px] font-mono font-black uppercase text-[#0F766E] hover:underline"
                                >
                                  [AUTO-SITUAR]
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <input 
                                  type="number"
                                  step="0.0001"
                                  value={formLat}
                                  onChange={(e) => setFormLat(Number(e.target.value))}
                                  placeholder="Latitud"
                                  className={cn(
                                    "w-full text-[10px] p-3 font-mono border bg-transparent focus:outline-none focus:border-[#0F766E] transition-colors rounded-none",
                                    theme === 'light' ? "border-zinc-300 text-zinc-900 bg-white" : "border-zinc-800 text-white bg-black/45"
                                  )}
                                  required
                                />
                                <input 
                                  type="number"
                                  step="0.0001"
                                  value={formLng}
                                  onChange={(e) => setFormLng(Number(e.target.value))}
                                  placeholder="Longitud"
                                  className={cn(
                                    "w-full text-[10px] p-3 font-mono border bg-transparent focus:outline-none focus:border-[#0F766E] transition-colors rounded-none",
                                    theme === 'light' ? "border-zinc-300 text-zinc-900 bg-white" : "border-zinc-800 text-white bg-black/45"
                                  )}
                                  required
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase tracking-wider text-zinc-400">Descripción detallada *</label>
                            <textarea
                              value={formDescription}
                              onChange={(e) => setFormDescription(e.target.value)}
                              placeholder="Proporcione una descripción detallada de actividades o de los sensores sintonizados..."
                              rows={3}
                              className={cn(
                                "w-full text-[10px] p-3 font-mono border bg-transparent focus:outline-none focus:border-[#0F766E] transition-colors rounded-none resize-none",
                                theme === 'light' ? "border-zinc-300 text-zinc-900 bg-white" : "border-zinc-800 text-white bg-black/45"
                              )}
                              required
                            />
                          </div>

                          {/* Cover Image Selector */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[8px] font-black uppercase tracking-wider text-zinc-400">Imagen de Portada *</label>
                              <div className="flex gap-4">
                                <button
                                  type="button"
                                  onClick={() => setFormImgMode('preset')}
                                  className={cn(
                                    "text-[8px] font-mono font-black uppercase",
                                    formImgMode === 'preset' ? "text-[#0F766E] border-b-2 border-[#0F766E]" : "text-zinc-550"
                                  )}
                                >
                                  Predeterminada
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setFormImgMode('upload')}
                                  className={cn(
                                    "text-[8px] font-mono font-black uppercase",
                                    formImgMode === 'upload' ? "text-[#0F766E] border-b-2 border-[#0F766E]" : "text-zinc-550"
                                  )}
                                >
                                  Cargar Archivo
                                </button>
                              </div>
                            </div>

                            {formImgMode === 'preset' ? (
                              <div className="grid grid-cols-4 gap-2">
                                {PRESET_IMAGES.map((preset, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setFormPresetImg(preset.url)}
                                    className={cn(
                                      "relative aspect-square border overflow-hidden",
                                      formPresetImg === preset.url ? "border-[#0F766E]" : (theme === 'light' ? "border-zinc-250" : "border-zinc-800")
                                    )}
                                  >
                                    <img src={preset.url} alt={preset.name} className="w-full h-full object-cover select-none" />
                                    <span className="absolute bottom-0 inset-x-0 text-[6.5px] bg-black/85 font-mono text-center text-zinc-300 truncate px-1 py-0.5">
                                      {preset.name}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div 
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                  "border-2 border-dashed p-6 text-center cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors",
                                  formCustomBase64 
                                    ? "border-emerald-555 bg-emerald-500/5 text-emerald-400" 
                                    : (theme === 'light' ? "border-zinc-300 hover:border-[#0F766E] bg-zinc-100/50" : "border-zinc-850 bg-neutral-950/20 hover:border-[#0F766E]")
                                )}
                              >
                                <input 
                                  type="file"
                                  ref={fileInputRef}
                                  onChange={handleFileChange}
                                  accept="image/*"
                                  className="hidden"
                                />
                                <Upload className="w-5 h-5 text-zinc-400" />
                                <span className="text-[8.5px] font-mono uppercase font-black">Cargar Portada Personalizada</span>
                                <span className="text-[7px] font-mono text-zinc-500">MÁXIMO PERMITIDO: 2 MB</span>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-end gap-3 pt-4">
                            <button
                              type="button"
                              onClick={() => setShowCreateForm(false)}
                              className={cn("px-6 py-3 border text-[9px] font-black uppercase tracking-wider rounded-none", theme === 'light' ? "bg-white border-zinc-200 text-zinc-600" : "bg-transparent border-zinc-800 text-white")}
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="bg-[#0F766E] hover:bg-black hover:text-[#0F766E] border border-transparent hover:border-[#0F766E] text-white hover:text-white font-black text-[9px] uppercase tracking-wider px-6 py-3 transition-colors"
                            >
                              {isSubmitting ? 'Registrando...' : 'Establecer Sonda'}
                            </button>
                          </div>
                        </>
                      )}
                    </form>
                  </motion.div>
                )}

                {/* Table of Events (Precisely formatted for administrators) */}
                <div className={cn(
                  "border rounded-none overflow-hidden",
                  theme === 'light' ? "bg-white border-zinc-200" : "bg-[#090909] border-zinc-850"
                )}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={cn(
                          "border-b border-zinc-200 dark:border-zinc-850 text-[9px] font-mono text-zinc-500 uppercase font-black uppercase tracking-wider",
                          theme === 'light' ? "bg-zinc-50" : "bg-black/40"
                        )}>
                          <th className="p-4">Sonda de Evento (Nombre)</th>
                          <th className="p-4">Ubicación / Campus</th>
                          <th className="p-4">Categoría</th>
                          <th className="p-4">Fecha Planificada</th>
                          <th className="p-4 text-right">Afluencia</th>
                          <th className="p-4 text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-850">
                        {events.map((event) => (
                          <tr 
                            key={event.id}
                            onClick={() => onSelectEvent(event)}
                            className={cn(
                              "text-xs transition-colors cursor-pointer group",
                              theme === 'light' ? "hover:bg-zinc-50" : "hover:bg-white/5"
                            )}
                          >
                            <td className="p-4 flex items-center gap-3">
                              <div className="w-10 h-10 overflow-hidden flex-shrink-0 bg-zinc-950 border border-zinc-800">
                                <img src={event.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" alt={event.title} />
                              </div>
                              <span className={cn("font-black uppercase tracking-tight", theme === 'light' ? "text-zinc-800" : "text-zinc-250")}>
                                {event.title}
                              </span>
                            </td>
                            <td className="p-4 font-mono text-[9px] text-zinc-500 max-w-[150px] truncate uppercase">
                              {event.location.name}
                            </td>
                            <td className="p-4">
                              <span className="px-2.5 py-1 text-[8px] font-mono tracking-widest bg-[#0F766E]/15 border border-[#0F766E]/30 text-[#0F766E] font-black uppercase">
                                {event.category}
                              </span>
                            </td>
                            <td className="p-4 font-mono text-xs text-zinc-550">
                              {event.date}
                            </td>
                            <td className="p-4 font-mono text-right font-black text-[#0F766E]">
                              {event.attendeesCount}
                            </td>
                            <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => onDeleteEvent && onDeleteEvent(event.id)}
                                className="p-2 bg-blue-950/20 border border-blue-500/10 text-[#0F766E] hover:bg-[#0F766E] hover:text-white transition-all flex items-center justify-center mx-auto"
                                title="Eliminar sonda asignada"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 border-t border-zinc-200 dark:border-zinc-850 flex justify-between items-center text-[9px] font-mono text-zinc-500 uppercase font-black">
                    <span>Mostrando 1-{events.length} de {events.length} eventos registrados</span>
                    <div className="flex gap-1">
                      <button className="px-2.5 py-1 border border-zinc-800 bg-neutral-950 text-white">[1]</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="tab-events-student"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="space-y-8"
              >
                {/* Tailored study metrics cards on top (from Image 3) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Mi Impacto Red', value: user.impact || '1.2k pt', tag: 'Acreditado', desc: 'Aportes al ecosistema UNL', icon: Award },
                    { label: 'Aportes de Sonda', value: `${user.contributions || '2'} fotos`, tag: 'Completado', desc: 'Sintonizado al campus', icon: Calendar },
                    { label: 'Estado del Sonda', value: 'ONLINE', tag: `${simulatedTransmissions} Envíos`, desc: user.node || 'node-04-luna', icon: Wifi },
                    { label: 'Identidad UNL', value: user.badge || 'Estudiante', tag: 'Validado', desc: 'Nivel/rol verificado', icon: User }
                  ].map((stat, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "p-6 border flex flex-col justify-between transition-all duration-300 relative overflow-hidden group hover:scale-[1.01] rounded-none text-left",
                        theme === 'light' ? "bg-white border-zinc-200 shadow-sm" : "bg-[#0c0c0c] border-[#17171d] border-zinc-850"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                          {stat.label}
                        </span>
                        <stat.icon className="w-5 h-5 text-[#0F766E]" />
                      </div>
                      <div className="mt-4 space-y-1 text-left">
                        <div className="text-2xl font-mono font-black tracking-tighter text-[#0F766E]">
                          {stat.value}
                        </div>
                        <div className="flex items-center justify-between text-[9px] font-mono text-zinc-550 pt-1.5 border-t border-zinc-200 dark:border-zinc-850">
                          <span className="text-zinc-400 font-bold uppercase truncate max-w-[110px]">{stat.desc}</span>
                          <span className="font-extrabold text-[#0F766E] hover:underline uppercase">{stat.tag}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
                  {/* Sondas de Eventos Activas (List Table) */}
                  <div className={cn(
                    "lg:col-span-2 p-8 border flex flex-col min-h-[440px] justify-between relative rounded-none text-left",
                    theme === 'light' ? "bg-white border-zinc-200 shadow-sm" : "bg-[#0c0c0c] border-zinc-850 border-[#17171d]"
                  )}>
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className={cn("text-lg font-black tracking-tight uppercase italic", theme === 'light' ? "text-zinc-900" : "text-white")}>
                          Sondas de Eventos Activas
                        </h3>
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse mt-1.5" />
                      </div>
                      <p className="text-[9px] text-[#0F766E] font-bold uppercase tracking-widest mb-6 font-mono">
                        Participando en la red central de tramas IoT - Loja
                      </p>

                      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-850">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className={cn(
                              "border-b border-zinc-200 dark:border-zinc-850 text-[9px] font-mono text-zinc-500 uppercase font-black tracking-wider",
                              theme === 'light' ? "bg-zinc-50" : "bg-black/40"
                            )}>
                              <th className="p-3">Sonda / Evento</th>
                              <th className="p-3">Ubicación</th>
                              <th className="p-3">Categoría</th>
                              <th className="p-3">Fecha</th>
                              <th className="p-3 text-right">Afluencia</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-850">
                            {events.map((event) => (
                              <tr 
                                key={event.id}
                                onClick={() => onSelectEvent(event)}
                                className={cn(
                                  "text-[11px] transition-colors cursor-pointer group",
                                  theme === 'light' ? "hover:bg-zinc-50" : "hover:bg-white/5"
                                )}
                              >
                                <td className="p-3 flex items-center gap-2">
                                  <div className="w-8 h-8 overflow-hidden flex-shrink-0 bg-zinc-950 border border-zinc-800">
                                    <img src={event.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" alt={event.title} />
                                  </div>
                                  <span className={cn("font-black uppercase tracking-tight text-[11px]", theme === 'light' ? "text-zinc-800" : "text-zinc-250")}>
                                    {event.title}
                                  </span>
                                </td>
                                <td className="p-3 font-mono text-[9px] text-zinc-550 max-w-[120px] truncate uppercase">
                                  {event.location.name}
                                </td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 text-[8px] font-mono tracking-widest bg-[#0F766E]/15 border border-[#0F766E]/30 text-[#0F766E] font-black uppercase">
                                    {event.category}
                                  </span>
                                </td>
                                <td className="p-3 font-mono text-[10px] text-zinc-550">
                                  {event.date}
                                </td>
                                <td className="p-3 font-mono text-right font-black text-[#0F766E]">
                                  {event.attendeesCount}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="p-3 border-t border-zinc-100 dark:border-zinc-850/40 flex justify-between items-center text-[9px] font-mono text-zinc-500 uppercase font-black mt-4">
                      <span>Canales activos: {events.length}</span>
                      <span className="text-[#0F766E]">Sincronización OK</span>
                    </div>
                  </div>

                  {/* Sonda Digital Certificate & ID Card Column */}
                  <div className={cn(
                    "p-8 border flex flex-col justify-between min-h-[440px] rounded-none text-left",
                    theme === 'light' ? "bg-white border-zinc-200" : "bg-[#0c0c0c] border-[#17171d] border-zinc-850"
                  )}>
                    <div>
                      <div className="border-b pb-4 border-zinc-200 dark:border-zinc-850 mb-6">
                        <h3 className={cn("text-xs font-black tracking-wider uppercase flex items-center gap-2", theme === 'light' ? "text-zinc-800" : "text-zinc-200")}>
                          <Award className="w-4 h-4 text-[#0F766E]" /> Mi Sonda UNL Acreditada
                        </h3>
                        <p className="text-[8px] text-zinc-550 block mt-1 uppercase">Credenciales Digitales de Investigador</p>
                      </div>
                      
                      {/* Interactive Digital Badge Card */}
                      <div className={cn(
                        "p-5 border relative overflow-hidden transition-all duration-300 hover:shadow-lg rounded-none flex flex-col justify-between min-h-[224px]",
                        theme === 'light' ? "bg-zinc-50 border-zinc-200" : "bg-[#0c0c11] border-zinc-850"
                      )}>
                        {/* Radial overlay decoration */}
                        <div className="absolute right-0 top-0 w-24 h-24 bg-radial-gradient from-[#0F766E]/15 to-transparent pointer-events-none" />

                        {/* Top row */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[8px] font-mono font-black uppercase text-[#0F766E] tracking-widest">Enlace Activo</span>
                          </div>
                          <Sparkles className="w-4 h-4 text-[#0F766E] animate-pulse" />
                        </div>

                        {/* Member details body */}
                        <div className="my-5 space-y-2 text-left">
                          <span className="text-xl font-black leading-none uppercase italic tracking-tight text-[#0F766E] block truncate">
                            {user.name}
                          </span>
                          <div className="space-y-1 border-t border-zinc-200 dark:border-zinc-950 pt-2">
                            <div className="flex justify-between items-center text-[8.5px] font-mono">
                              <span className="text-zinc-400 font-semibold uppercase">IDENTIFICADOR SONDA</span>
                              <span className={cn("font-bold text-[#0F766E]")}>{user.node || 'node-04-luna'}</span>
                            </div>
                            <div className="flex justify-between items-center text-[8.5px] font-mono">
                              <span className="text-zinc-400 font-semibold uppercase">ROL EN LA RED</span>
                              <span className={cn("font-bold", theme === 'light' ? "text-zinc-700" : "text-zinc-300")}>{user.role || 'Participante'}</span>
                            </div>
                            <div className="flex justify-between items-center text-[8.5px] font-mono">
                              <span className="text-zinc-400 font-semibold uppercase">MÉRITO ACADÉMICO</span>
                              <span className={cn("font-black text-amber-500")}>{user.badge || 'Estudiante'}</span>
                            </div>
                            <div className="flex justify-between items-center text-[8.5px] font-mono">
                              <span className="text-zinc-400 font-semibold uppercase">FIRMA DIGITAL</span>
                              <span className="text-emerald-500 font-black">VALIDADO</span>
                            </div>
                          </div>
                        </div>

                        {/* Footer row */}
                        <div className="border-t border-zinc-200 dark:border-zinc-950 pt-2 flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            <Battery className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[8px] font-mono font-black text-zinc-550 uppercase font-sans">Estación 98%</span>
                          </div>
                          <span className="text-[8px] font-mono font-semibold tracking-wider text-[#0F766E] uppercase font-bold">UNL IoT Sondas</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={() => {
                        showToast?.("Sintonizando servidor de generación de certificados...", "info", "Acreditaciones UNL");
                        setTimeout(() => {
                          showToast?.(`¡Certificado Académico firmado exitosamente para ${user.name}! Descargando en PDF...`, 'success', 'Acreditación');
                        }, 1500);
                      }}
                      className={cn(
                        "w-full text-center py-3 text-[8.5px] font-mono font-black uppercase tracking-widest border transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-4",
                        theme === 'light' ? "bg-zinc-950 hover:bg-zinc-900 border-zinc-250 text-white" : "bg-[#111] hover:bg-neutral-900 border-[#0F766E]/50 text-blue-400 hover:bg-[#0F766E]/10"
                      )}
                    >
                      [Descargar Certificado Sonda UNL]
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* TAB: SENSOR MONITORING */}
            {adminTab === 'sensors' && (
              <motion.div
                key="tab-sensors"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="space-y-6"
              >
                <div>
                  <h3 className={cn("text-lg font-black tracking-tight uppercase italic", theme === 'light' ? "text-zinc-900" : "text-white")}>
                    Monitoreo en Tiempo Real IoT
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Inspección y handshake con los nodos de microprocesadores locales ESP32 situados en el campus UNL.
                  </p>
                </div>

                {/* Grid of Microcontroller Nodes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {sensors.map((sensor) => {
                    const isOnline = sensor.status === 'Online';
                    const isRebooting = sensor.status.includes('Reiniciando');
                    return (
                      <div 
                        key={sensor.id} 
                        className={cn(
                          "p-6 border flex flex-col justify-between h-[250px] relative transition-all duration-300",
                          theme === 'light' ? "bg-white border-zinc-200 shadow-sm" : "bg-[#0b0b0b] border-zinc-850"
                        )}
                      >
                        {/* Header ID of MCU and Signal Dot */}
                        <div className="flex justify-between items-center pb-3 border-b border-zinc-200 dark:border-zinc-850">
                          <div>
                            <span className="text-[7.5px] font-mono text-zinc-500 block">NODE IDENTIFICATION</span>
                            <span className="text-xs font-mono font-black text-[#0F766E]">{sensor.id}</span>
                          </div>
                          <span className={cn(
                            "px-2.5 py-0.5 text-[8.5px] font-mono font-black uppercase text-center flex items-center gap-1.5",
                            isOnline 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : isRebooting 
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                                : "bg-zinc-805 text-zinc-500 border border-zinc-800"
                          )}>
                            <span className={cn("h-1.5 w-1.5 rounded-full inline-block", isOnline ? "bg-emerald-500" : isRebooting ? "bg-amber-500 animate-pulse" : "bg-zinc-650")} />
                            {sensor.status}
                          </span>
                        </div>

                        {/* Physical attributes metrics readout */}
                        <div className="py-4 space-y-2">
                          <div className="flex justify-between items-baseline text-xs">
                            <span className="text-zinc-550">Temperatura:</span>
                            <span className="font-mono text-sm font-black text-red-400">{sensor.temp ? `${sensor.temp}°C` : 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-baseline text-xs">
                            <span className="text-zinc-550">Humedad en Red:</span>
                            <span className="font-mono text-sm font-black text-white">{sensor.hum ? `${sensor.hum}%` : 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-baseline text-xs">
                            <span className="text-zinc-550">Batería Lógica:</span>
                            <span className="font-mono text-sm font-black text-zinc-400 flex items-center gap-1">
                              <Battery className="w-3.5 h-3.5 text-[#0F766E]" /> {sensor.batt}%
                            </span>
                          </div>
                        </div>

                        {/* Buttons action area */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-850">
                          <button
                            onClick={() => handleRebootNode(sensor.id)}
                            className={cn(
                              "text-[8.5px] font-mono uppercase font-black py-2.5 transition-colors border",
                              theme === 'light' ? "bg-zinc-55 hover:bg-zinc-100 text-zinc-800" : "bg-black hover:bg-neutral-950 text-zinc-350 border-zinc-850"
                            )}
                            disabled={!isOnline}
                            type="button"
                          >
                            Reiniciar ESP
                          </button>
                          <button
                            onClick={() => handleOpenLogs(sensor.id)}
                            className="bg-[#0F766E] hover:bg-black text-white hover:text-[#0F766E] border border-transparent hover:border-[#0F766E] text-[8.5px] font-mono uppercase font-black py-2.5 transition-all text-center"
                            type="button"
                          >
                            Ver Registros
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Large Network Summary block & Alerts */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className={cn(
                    "p-6 border md:col-span-2 text-left space-y-2.5",
                    theme === 'light' ? "bg-white border-zinc-200" : "bg-[#0b0b0b] border-zinc-850"
                  )}>
                    <h4 className="text-[10px] font-black uppercase text-[#0F766E] tracking-widest">
                      Agregación y Handshake Estacional
                    </h4>
                    <p className="text-xs text-zinc-520 leading-relaxed">
                      La topología de red actual une los 42 nodos implementados en el cuadrante norte con un margen de confiabilidad del 99.1%. El microprocesador actúa como puente principal de Handshake satelital de Loja.
                    </p>
                    <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between text-[8px] font-mono text-zinc-400 uppercase">
                      <span>Proceso de Sintonización: Automático</span>
                      <span className="text-[#0F766E] font-bold">handshake cifrado v2.1</span>
                    </div>
                  </div>

                  <div className={cn(
                    "p-6 border text-left flex flex-col justify-between",
                    theme === 'light' ? "bg-white border-zinc-200" : "bg-[#0b0b0b] border-zinc-850"
                  )}>
                    <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                      Mantenimiento Crítico
                    </h4>
                    <span className="text-2xl font-mono font-black text-[#0F766E] block mt-2">
                      03 Nodos
                    </span>
                    <p className="text-[10px] text-zinc-550 leading-relaxed mt-1">
                      Requieren reemplazo físico de batería de litio en un rango aproximado de 48 horas.
                    </p>
                  </div>
                </div>

                {/* Floating Simulate Terminal Log overlay popup */}
                {logNode && (
                  <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[450] flex items-center justify-center p-4">
                    <div className="w-full max-w-xl bg-[#000000] border-2 border-[#0F766E] p-6 shadow-[0_0_50px_rgba(15, 118, 110,0.2)]">
                      <div className="flex justify-between items-center border-b border-zinc-850 pb-3 mb-4">
                        <span className="text-xs font-mono font-black text-[#0F766E] uppercase tracking-wider">
                          Consola Depuración / {logNode}
                        </span>
                        <button 
                          onClick={() => setLogNode(null)}
                          className="text-[9px] font-mono uppercase bg-[#0F766E] text-white px-2.5 py-1 font-black"
                        >
                          Cerrar
                        </button>
                      </div>
                      <div className="bg-[#050505] p-4 text-[10px] font-mono space-y-2 max-h-[250px] overflow-y-auto border border-zinc-900 custom-scrollbar text-emerald-400 text-left">
                        {sensorLogs.map((log, index) => (
                          <div key={index} className="leading-relaxed">
                            {log}
                          </div>
                        ))}
                      </div>
                      <div className="text-right text-[8px] text-zinc-500 font-mono mt-4 uppercase">
                        Sintonizador Centralizado UNL
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: CONTENT MODERATION */}
            {adminTab === 'moderation' && (
              <motion.div
                key="tab-moderation"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="space-y-6"
              >
                {/* Header moderation */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className={cn("text-lg font-black tracking-tight uppercase italic", theme === 'light' ? "text-zinc-900" : "text-white")}>
                      Moderación de Contenido
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Revise y guarde las imágenes subidas por estudiantes para salvaguardar el entorno de convivencia UNL.
                    </p>
                  </div>
                  {selectedModerationItems.length > 0 && (
                    <button
                      onClick={handleApproveSelected}
                      className="bg-[#0F766E] text-white hover:bg-neutral-900 hover:text-[#0F766E] font-black text-xs uppercase tracking-widest px-6 py-3 border border-transparent hover:border-[#0F766E] transition-all"
                    >
                      Aprobar Seleccionados ({selectedModerationItems.length})
                    </button>
                  )}
                </div>

                {pendingMedia.length === 0 ? (
                  <div className="p-12 text-center border-2 border-dashed border-zinc-800/80 space-y-3">
                    <Check className="w-12 h-12 text-emerald-500 mx-auto" />
                    <h4 className="text-sm font-black uppercase text-zinc-300">TODO PROCESADO CORRECTAMENTE</h4>
                    <p className="text-xs text-zinc-500">No hay cargas estudiantiles pendientes de revisión actualmente.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {pendingMedia.map((item) => {
                      const isChecked = selectedModerationItems.includes(item.id);
                      return (
                        <div 
                          key={item.id}
                          className={cn(
                            "border relative flex flex-col justify-between overflow-hidden group select-none transition-all duration-300",
                            theme === 'light' ? "bg-white border-zinc-200" : "bg-[#0b0b0b] border-zinc-850"
                          )}
                        >
                          {/* Image Preview */}
                          <div className="aspect-square w-full relative overflow-hidden bg-black/20">
                            <img 
                              src={item.image} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-transform duration-500 group-hover:scale-105" 
                              alt="Student Submission" 
                            />
                            {/* Checkbox selector */}
                            <div className="absolute top-2 left-2 z-10">
                              <button
                                onClick={() => handleToggleSelectMedia(item.id)}
                                className={cn(
                                  "w-6 h-6 flex items-center justify-center border transition-all",
                                  isChecked 
                                    ? "bg-[#0F766E] border-[#0F766E] text-white font-black" 
                                    : "bg-black/60 border-white text-transparent hover:border-[#0F766E]"
                                )}
                              >
                                {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                              </button>
                            </div>
                            <span className="absolute bottom-2 right-2 bg-black/80 border border-zinc-800 text-[8px] font-mono px-2 py-0.5 text-[#0F766E] uppercase font-bold">
                              {item.badge}
                            </span>
                          </div>

                          {/* Student Info */}
                          <div className="p-4 space-y-2">
                            <div>
                              <span className="text-[10px] font-black uppercase text-white block truncate">
                                {item.studentName}
                              </span>
                              <span className="text-[8px] font-mono text-zinc-500 font-semibold block uppercase">
                                ID: {item.studentId} • {item.time}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono border-y border-zinc-850 py-1.5 text-zinc-400 block truncate uppercase font-bold">
                              Evento: {item.eventName}
                            </span>
                          </div>

                          {/* Actions buttons */}
                          <div className="grid grid-cols-2 divide-x divide-zinc-800 border-t border-zinc-850">
                            <button
                              onClick={() => handleRejectSingle(item.id)}
                              className={cn(
                                "py-3 text-[9px] font-mono font-black uppercase text-center transition-colors hover:bg-red-950/20 text-red-500",
                                theme === 'light' ? "bg-zinc-50 hover:bg-red-50" : "bg-[#0c0c0c] hover:bg-neutral-900"
                              )}
                              type="button"
                            >
                              Rechazar
                            </button>
                            <button
                              onClick={() => handleApproveSingle(item.id)}
                              className="py-3 text-[9px] font-mono font-black uppercase text-center transition-colors bg-[#0F766E] hover:bg-black text-white hover:text-[#0F766E] border-t border-transparent hover:border-[#0F766E]"
                              type="button"
                            >
                              Aprobar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: ANALYTICS CLIMA REPORTS */}
            {adminTab === 'analytics' && (
              <motion.div
                key="tab-analytics"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="space-y-6"
              >
                <div>
                  <h3 className={cn("text-lg font-black tracking-tight uppercase italic", theme === 'light' ? "text-zinc-900" : "text-white")}>
                    Analíticas de Estabilidad Climática
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Inspección histórica de registros atmosféricos consolidados de las sondas UNL.
                  </p>
                </div>

                {/* Sub Chart element area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Long terms area chart mockup */}
                  <div className={cn("p-6 border flex flex-col justify-between h-[300px]", theme === 'light' ? "bg-white border-zinc-200" : "bg-[#0b0b0b] border-zinc-850")}>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#0F766E] mb-1">PROMEDIO ATMOSFÉRICO DE HUMEDAD</h4>
                      <p className="text-xs text-zinc-550 leading-normal">Inspección de calibraciones sintonizadas en las últimas 24 h.</p>
                    </div>
                    <div className="flex-1 mt-4 h-full min-h-[140px] flex items-end">
                      {/* Simulating a bar graph with clean indicators */}
                      <div className="w-full flex justify-between items-end h-28 px-4">
                        {[52, 63, 44, 58, 71, 48, 62].map((val, idx) => (
                          <div key={idx} className="flex flex-col items-center gap-1.5 w-full">
                            <span className="text-[8px] font-mono font-black text-white">{val}%</span>
                            <div className="w-4 bg-zinc-805 dark:bg-zinc-800/80 rounded-none overflow-hidden" style={{ height: `${val}px` }}>
                              <div className="w-full bg-[#0F766E]" style={{ height: '70%', marginTop: '30%' }} />
                            </div>
                            <span className="text-[7.5px] font-mono text-zinc-500">D{idx+1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Participation statistics */}
                  <div className={cn("p-6 border flex flex-col justify-between h-[300px]", theme === 'light' ? "bg-white border-zinc-200" : "bg-[#0b0b0b] border-zinc-850")}>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">INTERACCIÓN POR ÁREAS UNL</h4>
                      <p className="text-xs text-zinc-550 leading-normal">Distribución porcentual aproximada de telemetría recopilada.</p>
                    </div>
                    <div className="space-y-4 py-4 flex-1 flex flex-col justify-center">
                      {[
                        { name: 'Área de la Energía e Industrias (Sistemas)', percentage: '48%', color: '#0F766E' },
                        { name: 'Área Agropecuaria y de Desarrollo Sostenible', percentage: '32%', color: '#e5e7eb' },
                        { name: 'Área de la Educación, el Arte y Comunicación', percentage: '20%', color: '#a1a1aa' }
                      ].map((bar, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-[9px] font-bold uppercase">
                            <span className="truncate max-w-[200px]">{bar.name}</span>
                            <span className="font-mono font-black text-[#0F766E]">{bar.percentage}</span>
                          </div>
                          <div className="w-full h-1.5 bg-zinc-800 rounded-none overflow-hidden">
                            <div className="h-full" style={{ width: bar.percentage, backgroundColor: bar.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: PROFILE / ACCOUNT SETTINGS */}
            {adminTab === 'profile' && (
              <motion.div
                key="tab-profile"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="max-w-4xl space-y-6 text-left"
              >
                <div>
                  <h3 className={cn("text-lg font-black tracking-tight uppercase italic", theme === 'light' ? "text-zinc-900" : "text-white")}>
                    Configuración de Cuenta Admin
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Gestione la identidad del curador principal y configure medidas de Handshake de cuenta.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Column 1: Personal profile / login credentials */}
                  <form onSubmit={handleSaveProfileSettings} className={cn("p-6 border space-y-4", theme === 'light' ? "bg-white border-zinc-200" : "bg-[#0b0b0b] border-zinc-850")}>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#0F766E] border-b border-zinc-850 pb-2">
                      Identidad del Curador General
                    </h4>
                    
                    {profileSavedMsg && (
                      <div className="border border-emerald-500/40 bg-emerald-500/5 p-3 text-center text-[9px] font-mono uppercase text-emerald-400 font-bold">
                        [Handshake OK] Credenciales guardadas con éxito
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black uppercase text-zinc-400 tracking-wider">Nombre del Administrador</label>
                      <input 
                        type="text"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        className={cn(
                          "w-full text-[10px] p-3 font-mono border bg-transparent focus:outline-none focus:border-[#0F766E] rounded-none",
                          theme === 'light' ? "border-zinc-300 text-zinc-900" : "border-zinc-800 text-white"
                        )}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black uppercase text-zinc-400 tracking-wider">Correo Institucional UNL</label>
                      <input 
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className={cn(
                          "w-full text-[10px] p-3 font-mono border bg-transparent focus:outline-none focus:border-[#0F766E] rounded-none",
                          theme === 'light' ? "border-zinc-300 text-zinc-900" : "border-zinc-800 text-white"
                        )}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black uppercase text-zinc-400 tracking-wider">Rol de Acceso Asignado</label>
                      <input 
                        type="text"
                        value={adminRole}
                        onChange={(e) => setAdminRole(e.target.value)}
                        className={cn(
                          "w-full text-[10px] p-3 font-mono border focus:outline-none focus:border-[#0F766E] rounded-none select-text",
                          theme === 'light' ? "border-zinc-300 text-zinc-900 bg-white" : "border-zinc-800 text-white bg-black/40"
                        )}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="bg-[#0F766E] hover:bg-black hover:text-[#0F766E] border border-transparent hover:border-[#0F766E] text-white font-black text-[9px] uppercase tracking-widest py-3 px-6 transition-all cursor-pointer"
                    >
                      {profileSaving ? 'Guardando...' : 'Guardar Identidad'}
                    </button>
                  </form>

                  {/* Column 2: Security settings / info */}
                  <div className="space-y-6">
                    <div className={cn("p-6 border space-y-4", theme === 'light' ? "bg-white border-zinc-200" : "bg-[#0b0b0b] border-zinc-850")}>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#0F766E] border-b border-zinc-850 dark:border-zinc-850 pb-2">
                        Seguridad y Llaves Criptográficas
                      </h4>
                      <p className="text-xs text-zinc-550 leading-relaxed">
                        Su cuenta administra privilegios amplificados de borrado de sondas e inspección directa de microprocesadores locales ESP32. Se recomienda altamente no compartir Handshakes.
                      </p>
                      <div className="space-y-2 pt-2 text-[9px] font-mono uppercase">
                        <div className={cn(
                          "flex justify-between p-3 border font-mono tracking-wider",
                          theme === 'light' 
                            ? "bg-zinc-100/50 text-zinc-650 border-zinc-250" 
                            : "bg-black/35 text-zinc-400 border-zinc-900"
                        )}>
                          <span>Nivel de Permisos:</span>
                          <span className="text-[#0F766E] font-black font-mono">10 - Super Admin</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick reference block */}
                    <div className={cn("p-6 border border-dashed text-left space-y-1", theme === 'light' ? "bg-zinc-100/50 border-zinc-300" : "bg-zinc-905 border-zinc-800")}>
                      <h5 className="text-[10px] font-black uppercase text-zinc-400 tracking-wide">
                        Sintonizador de Telemetría v2.2
                      </h5>
                      <p className="text-[10px] text-zinc-550 leading-relaxed">
                        Este módulo sincroniza directamente los perfiles activos entre estudiantes registrados y el canal administrativo centralizado UNL.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </main>

        {/* Dynamic Static Administrative Footer matching aesthetic */}
        <footer className={cn(
          "h-14 border-t px-8 flex flex-col sm:flex-row items-center justify-between text-[8px] font-mono text-zinc-500 uppercase font-black relative z-10 transition-colors duration-300",
          theme === 'light' ? "border-zinc-200 bg-zinc-100 text-zinc-650" : "border-zinc-850 bg-[#090909] text-zinc-500"
        )}>
          <div>Consola centralizada Universidad Nacional de Loja / Handshake OK.</div>
          <div className="flex gap-4 sm:gap-10 mt-1 sm:mt-0">
            <span>Metodología: <span className="text-[#0F766E]">Kanban + XP</span></span>
            <span>Stack: <span className="text-[#0F766E]">Py / K8s / IoT ESP32</span></span>
          </div>
        </footer>

      </div>

    </div>
  );
};

const WeatherHub = ({ 
  weather, 
  className,
  theme = 'dark'
}: { 
  weather: WeatherData | null; 
  className?: string;
  theme?: 'dark' | 'light';
}) => {
  if (!weather) return null;

  const data = [
    { time: '03:00', temp: weather.temp - 2 },
    { time: '07:00', temp: weather.temp - 1 },
    { time: '11:00', temp: weather.temp + 3 },
    { time: '15:00', temp: weather.temp },
    { time: '19:00', temp: weather.temp - 1 },
    { time: '23:00', temp: weather.temp },
  ];

  return (
    <div className={cn("space-y-6 pt-4", className)}>
      {/* Main Card */}
      <div className="bg-gradient-to-br from-[#1A1C3D] to-[#0D0E21] rounded-3xl p-6 border border-white/5 relative overflow-hidden shadow-2xl text-white">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-white">Loja, Ecuador</h3>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Tuesday, May 11, 2026</p>
            </div>
            <div className="bg-black/20 p-2 rounded-xl border border-white/5">
               <MapIcon className="w-4 h-4 text-zinc-400" />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-7xl font-black italic tracking-tighter leading-none mb-2 text-white">{weather.temp.toFixed(1)}°c</h4>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-450 uppercase tracking-wider">{weather.feelsLike.toFixed(1)}°c / {(weather.temp + 3).toFixed(1)}°c</span>
                <span className="text-sm font-bold text-white uppercase tracking-tighter mt-1 italic">{weather.description}</span>
              </div>
            </div>
            <div className="relative">
               {weather && (
                 <img 
                   src={getIconUrl(weather.icon)} 
                   className="w-40 h-40 drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]" 
                   alt="weather icon" 
                 />
               )}
            </div>
          </div>
        </div>
        {/* Background mesh/lights */}
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Metrics List */}
      <div className="space-y-3">
        {[
          { icon: Thermometer, label: 'Thermal Sensation', value: `${weather.feelsLike.toFixed(1)}°c` },
          { icon: CloudRain, label: 'Probability of rain', value: `${weather.rainChance}%` },
          { icon: Wind, label: 'Wind Speed', value: `${weather.windSpeed} km/h` },
          { icon: Droplets, label: 'Air Humidity', value: `${weather.humidity}%` },
          { icon: Sun, label: 'Uv Index', value: weather.uvIndex },
        ].map((item, i) => (
          <div 
            key={i} 
            className={cn(
              "flex justify-between items-center py-4 border-b px-2 transition-all cursor-pointer group",
              theme === 'light' 
                ? "border-zinc-200 hover:bg-zinc-100/50" 
                : "border-zinc-800/50 hover:bg-white/5"
            )}
          >
            <div className="flex items-center gap-4">
              <item.icon className="w-4 h-4 text-zinc-500 group-hover:text-[#0F766E] transition-colors" />
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-colors",
                theme === 'light' ? "text-zinc-650 group-hover:text-[#0F766E]" : "text-zinc-400 group-hover:text-white"
              )}>{item.label}</span>
            </div>
            <span className={cn(
              "text-sm font-black font-mono transition-colors",
              theme === 'light' ? "text-zinc-900" : "text-white"
            )}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* 5-Day Mini Forecast */}
      <div className={cn(
        "grid grid-cols-5 gap-2 p-1 rounded-2xl border transition-all duration-300",
        theme === 'light' ? "bg-white border-zinc-200 shadow-sm" : "bg-[#111] border-[#222]"
      )}>
        {['Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
          <div key={i} className={cn(
            "flex flex-col items-center py-4 rounded-xl space-y-2 transition-all",
            i === 0 
              ? (theme === 'light' ? "bg-zinc-900 text-white shadow-md border border-zinc-850" : "bg-[#1A1C3D] border border-white/10 text-white") 
              : (theme === 'light' ? "text-zinc-800 hover:bg-zinc-50" : "text-white hover:bg-white/5")
          )}>
            <span className={cn(
              "text-[10px] font-bold uppercase",
              i === 0 ? "text-[#0F766E]" : "text-zinc-500"
            )}>{day}</span>
            <CloudRain className={cn(
              "w-4 h-4",
              i === 0 ? "text-[#0F766E]" : "text-blue-400"
            )} />
            <div className="flex flex-col items-center">
              <span className={cn("text-xs font-black", i === 0 && theme === 'light' ? "text-white" : "")}>18°</span>
              <span className="text-[9px] font-bold text-zinc-500">13°</span>
            </div>
          </div>
        ))}
      </div>

      {/* Temperature Chart */}
      <div className={cn(
        "border p-4 rounded-3xl transition-all duration-300",
        theme === 'light' ? "bg-white border-zinc-200 shadow-sm text-zinc-900" : "bg-[#0A0A0A] border-[#222]"
      )}>
        <div className="flex justify-between items-center mb-6">
           <span className={cn(
             "text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
             theme === 'light' ? "text-zinc-600" : "text-zinc-500"
           )}>
             <Activity className="w-3 h-3 text-[#0F766E]" /> Climatology Analytics
           </span>
           <span className="text-[9px] font-mono text-[#0F766E] font-black">STABLE</span>
        </div>
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F766E" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0F766E" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                hide 
              />
              <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: theme === 'light' ? '#ffffff' : '#111111', 
                  border: theme === 'light' ? '1px solid #e4e4e7' : '1px solid #222222', 
                  borderRadius: '8px' 
                }}
                itemStyle={{ color: '#0F766E', fontWeight: 'bold', fontSize: '10px' }}
                labelStyle={{ display: 'none' }}
              />
              <Area 
                type="monotone" 
                dataKey="temp" 
                stroke="#0F766E" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorTemp)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between mt-2 px-2 mb-6">
           {data.map((d, i) => (
             <span key={i} className={cn(
               "text-[8px] font-mono",
               theme === 'light' ? "text-zinc-500" : "text-zinc-700"
             )}>{d.time}</span>
           ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
           <button className={cn(
             "text-[9px] font-black uppercase py-3 rounded-xl border tracking-widest transition-all",
             theme === 'light' 
               ? "bg-zinc-900 border-zinc-900 text-white hover:bg-black" 
               : "bg-[#1A1C3D] border-white/10 text-white"
           )}>Temperature</button>
           <button className={cn(
             "text-[9px] font-black uppercase py-3 rounded-xl border tracking-widest transition-all",
             theme === 'light' 
               ? "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50" 
               : "bg-[#0D0D0D] border-zinc-800 text-zinc-600 font-bold"
           )}>Wind Speed</button>
        </div>
      </div>
    </div>
  );
};

const MobileView = ({ 
  user, 
  onLogout, 
  onSelectEvent,
  events,
  theme = 'dark',
  onThemeToggle,
  onSwitchToDashboard,
  showToast
}: { 
  user: UserProfile; 
  onLogout: () => void; 
  onSelectEvent: (event: Event) => void; 
  events: Event[];
  theme?: 'dark' | 'light';
  onThemeToggle?: () => void;
  onSwitchToDashboard?: () => void;
  showToast?: (message: string, type: 'success' | 'error' | 'info', title?: string) => void;
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [view, setView] = useState<'feed' | 'map' | 'profile' | 'weather' | 'notifications' | 'upload'>('feed');
  const [uploadEvent, setUploadEvent] = useState<Event | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const simulateCapture = async () => {
    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeEventPhoto("placeholder_base64"); 
      setAnalysisResult(result || "Evento detectado en el campus UNL. Pulso académico: Óptimo.");
    } catch (e) {
      setAnalysisResult("Sensing completado. Flujo masivo detectado en zona universitaria.");
    } finally {
      setAnalyzing(false);
    }
  };
  
  useEffect(() => {
    getLojaWeather().then(setWeather);
  }, []);

  return (
    <div className={cn(
      "max-w-md mx-auto h-screen font-sans overflow-hidden flex flex-col border-x transition-colors duration-300 relative",
      theme === 'light' 
        ? "bg-[#fafafa] text-zinc-900 border-zinc-200 shadow-xl" 
        : "bg-black text-white border-zinc-800 shadow-[0_0_100px_rgba(15, 118, 110,0.1)]"
    )}>
      {/* Header with App Title and Weather */}
      <header className={cn(
        "px-6 pt-6 pb-4 relative overflow-hidden border-b transition-colors duration-300",
        theme === 'light' ? "bg-white border-zinc-150" : "bg-[#09090D]/95 border-zinc-900"
      )}>
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-1.5">
              <div className="h-[2px] w-5 bg-[#0F766E]" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-550">Plataforma de Sensores</span>
            </div>

            {/* Inline Micro customizations block inside mobile container */}
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => {
                  onThemeToggle?.();
                  showToast?.(theme === 'dark' ? 'Tema Claro sintonizado' : 'Tema Oscuro sintonizado', 'info', 'Ajustes');
                }}
                className={cn(
                  "p-2 border transition-all active:scale-95 cursor-pointer rounded-none",
                  theme === 'light' 
                    ? "bg-white border-zinc-250 text-zinc-700 hover:bg-zinc-100" 
                    : "bg-[#161616] border-zinc-850 hover:bg-[#202020] text-zinc-400 hover:text-white"
                )}
                title="Sintonizar de Color"
                type="button"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-[#0F766E]" />}
              </button>

              {onSwitchToDashboard && (
                <button 
                  onClick={onSwitchToDashboard}
                  className={cn(
                    "p-2 border font-mono text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 rounded-none",
                    theme === 'light' 
                      ? "bg-zinc-900 border-zinc-900 text-white hover:bg-zinc-800" 
                      : "bg-[#11111a] border-[#0F766E]/45 text-blue-400 hover:bg-[#0F766E]/15"
                  )}
                  title="Sintonizar Panel Web"
                  type="button"
                >
                  <Database className="w-3.5 h-3.5" />
                  Consola
                </button>
              )}
            </div>
          </div>
          <h1 className={cn(
            "text-2xl font-black italic tracking-tighter uppercase leading-none mt-1.5 mb-3.5",
            theme === 'light' ? "text-zinc-900" : "text-white"
          )}>
            UNL-<span className="text-[#0F766E]">CLOUD-CONNECT</span>
          </h1>
          <div className="flex items-center justify-between gap-2 border-t border-zinc-100 dark:border-zinc-900/40 pt-3">
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "border px-2.5 py-1 rounded-none flex items-center gap-1.5 transition-colors duration-300 text-[10px] font-bold font-mono",
                theme === 'light' ? "bg-zinc-150 border-zinc-200 text-zinc-800" : "bg-white/5 border-white/10 text-white/90"
              )}>
                <ThermometerSun className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>{weather?.temp ? `${weather.temp.toFixed(1)}°C` : 'Sensing...'}</span>
              </div>
              <div className={cn(
                "border px-2.5 py-1 rounded-none flex items-center gap-1.5 transition-colors duration-300 text-[10px] font-bold font-mono uppercase tracking-wider",
                theme === 'light' ? "bg-zinc-150 border-zinc-200 text-zinc-750 font-black" : "bg-white/5 border-white/10 text-zinc-400"
              )}>
                <CloudRain className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>
                  {weather?.description === 'partly-cloudy-day' ? 'Nublado' : weather?.description || 'Enlace'}
                </span>
              </div>
            </div>
            
            <button 
              onClick={() => {
                setView('map');
                showToast?.("Sintonizando mapa de sensores interactivo...", "info", "Mapa");
              }}
              className={cn(
                "flex items-center gap-1 py-1 px-2.5 border transition-all font-mono rounded-none cursor-pointer duration-200 text-[9px] font-black uppercase tracking-wider",
                theme === 'light'
                  ? "bg-zinc-900 border-zinc-900 text-white hover:bg-zinc-800"
                  : "bg-[#0F766E]/15 border-[#0F766E]/65 text-blue-400 hover:bg-[#0F766E]/30"
              )}
            >
              <MapIcon className="w-3 h-3" />
              <span>Sensing Mapa</span>
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
           <MapIcon className="w-64 h-64 -rotate-12 translate-x-32" />
        </div>
      </header>

      {/* Main Content Area */}
      <div 
        onScroll={(e) => {
          const scrollTop = e.currentTarget.scrollTop;
          const isScrolled = scrollTop > 25;
          if (scrolled !== isScrolled) {
            setScrolled(isScrolled);
          }
        }}
        className={cn(
          "flex-1 overflow-y-auto pb-32 transition-colors duration-300",
          theme === 'light' ? "bg-[#fafafa]" : "bg-[#0A0A0A]"
        )}
      >
        <AnimatePresence mode="wait">
          {view === 'feed' ? (
            <motion.div 
              key="feed"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="px-6 space-y-8 py-8"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500 font-mono">Pulso del Campus Académico</h2>
                <span className="text-[9px] text-[#0F766E] font-mono flex items-center gap-1 animate-pulse font-black">
                   CONECTADO AL CLUSTER UNL
                  </span>
              </div>
              
              <div className="space-y-8">
                {events.map((event) => (
                  <motion.div 
                    key={event.id}
                    onClick={() => onSelectEvent(event)}
                    className={cn(
                      "group relative h-[450px] w-full rounded-none overflow-hidden border cursor-pointer hover:border-[#0F766E] hover:shadow-[0_0_30px_rgba(15, 118, 110,0.15)] transition-all duration-300",
                      theme === 'light' ? "border-zinc-200 bg-white shadow-sm" : "border-[#222] bg-[#111]"
                    )}
                    whileTap={{ scale: 0.99 }}
                  >
                    <img src={event.imageUrl} className="absolute inset-0 w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 transition-all duration-700" alt={event.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-8 w-full z-10">
                      <div className="flex gap-2 mb-4">
                        <span className="text-[9px] font-black uppercase tracking-wider bg-[#0F766E] text-white px-3 py-1">
                          {event.category}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-wider bg-white text-black px-3 py-1">
                          {event.attendeesCount}+ SENSING
                        </span>
                      </div>
                      <h3 className="text-4xl font-black italic tracking-tighter mb-4 leading-none uppercase text-white">{event.title}</h3>
                      <div className="flex justify-between items-center pt-6 border-t border-white/20">
                         <div className="flex items-center gap-2">
                           <MapIcon className="w-3.5 h-3.5 text-white/90" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-white">{event.location.name}</span>
                         </div>
                         <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setUploadEvent(event); 
                            setView('upload'); 
                          }}
                          className="bg-[#0F766E] text-white p-4 rounded-full shadow-[0_0_20px_rgba(15, 118, 110,0.4)] hover:scale-105 active:scale-95 transition-all"
                         >
                           <Camera className="w-6 h-6" />
                         </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : view === 'map' ? (
            <motion.div 
              key="map"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="p-8 flex-1 flex flex-col min-h-0">
                <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-6 font-mono">Distributed Map Sensing / Loja-EC</h2>
                <div className={cn(
                  "h-[450px] w-full border transition-all duration-300 rounded overflow-hidden shadow-sm",
                  theme === 'light' ? "border-zinc-200 bg-white" : "border-[#222] bg-[#111]"
                )}>
                  <EventMap events={events} theme={theme} />
                </div>
              </div>
            </motion.div>
          ) : view === 'weather' ? (
            <motion.div 
               key="weather"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="p-8 pb-32"
            >
               <h2 className={cn(
                 "text-[11px] font-black uppercase tracking-[0.4em] mb-6 px-2 font-mono",
                 theme === 'light' ? "text-zinc-600" : "text-zinc-500"
               )}>Weather Engine v2.0</h2>
               <WeatherHub weather={weather} theme={theme} />
            </motion.div>
          ) : view === 'notifications' ? (
            <motion.div 
               key="notifications"
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0 }}
               className="p-8 pb-32 space-y-6 animate-pulse-subtle"
            >
               <div className="flex justify-between items-center mb-2">
                 <h2 className={cn(
                   "text-[11px] font-black uppercase tracking-[0.4em] font-mono",
                   theme === 'light' ? "text-zinc-600" : "text-zinc-500"
                 )}>Centro de Alertas IoT</h2>
                 <span className="text-[9px] bg-[#0F766E]/10 text-[#0F766E] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                   3 Activas
                 </span>
               </div>

               <div className="space-y-4">
                 <div className={cn(
                   "p-4 border-l-4 rounded-xl transition-all duration-300",
                   theme === 'light' 
                     ? "bg-white border-l-[#0F766E] border-y border-r border-zinc-200/80 shadow-sm" 
                     : "bg-[#111] border-l-[#0F766E] border-y border-r border-[#222]"
                 )}>
                   <div className="flex justify-between items-start mb-1">
                     <span className="text-[9px] font-black text-[#0F766E] uppercase tracking-wider">Límite Superado</span>
                     <span className="text-[8.5px] text-zinc-400 font-mono">Hace 2 min</span>
                   </div>
                   <h4 className="text-xs font-black uppercase tracking-tight">Humedad de Invernadero UNL</h4>
                   <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                     El sensor de humedad en la Facultad de Agropecuaria ha reportado un nivel pico de 84.5% HR.
                   </p>
                 </div>

                 <div className={cn(
                   "p-4 border-l-4 rounded-xl transition-all duration-300",
                   theme === 'light' 
                     ? "bg-white border-l-zinc-900 border-y border-r border-zinc-200/80 shadow-sm" 
                     : "bg-[#111] border-l-white border-y border-r border-[#222]"
                 )}>
                   <div className="flex justify-between items-start mb-1">
                     <span className="text-[9px] font-black uppercase tracking-wider text-zinc-600">Sincronización</span>
                     <span className="text-[8.5px] text-zinc-400 font-mono">Hace 25 min</span>
                   </div>
                   <h4 className="text-xs font-black uppercase tracking-tight">Handshake de Nodo v4.0 Completo</h4>
                   <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                     El terminal central sincronizó 142 lecturas de telemetría de manera exitosa con el servidor institucional.
                   </p>
                 </div>

                 <div className={cn(
                   "p-4 border-l-4 rounded-xl transition-all duration-300",
                   theme === 'light' 
                     ? "bg-white border-l-amber-500 border-y border-r border-zinc-200/80 shadow-sm" 
                     : "bg-[#111] border-l-amber-500 border-y border-r border-[#222]"
                 )}>
                   <div className="flex justify-between items-start mb-1">
                     <span className="text-[9px] font-black text-amber-500 uppercase tracking-wider font-bold">Estado de Batería</span>
                     <span className="text-[8.5px] text-zinc-400 font-mono">Hace 2 horas</span>
                   </div>
                   <h4 className="text-xs font-black uppercase tracking-tight">Batería Baja en Nodo Secundario</h4>
                   <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                     La celda fotovoltaica del nodo 07-Luna reportó una carga del 12%. Sonda en modo de ahorro energético.
                   </p>
                 </div>

                 <div className={cn(
                   "p-4 border-l-4 rounded-xl transition-all duration-300 opacity-60",
                   theme === 'light' 
                     ? "bg-white border-l-emerald-500 border-y border-r border-zinc-200/80 shadow-sm" 
                     : "bg-[#111] border-l-emerald-500 border-y border-r border-[#222]"
                 )}>
                   <div className="flex justify-between items-start mb-1">
                     <span className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">Calibración</span>
                     <span className="text-[8.5px] text-zinc-400 font-mono">Hace 1 día</span>
                   </div>
                   <h4 className="text-xs font-black uppercase tracking-tight">Sonda Atmosférica Inicializada</h4>
                   <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                     La calibración automática de sensores de material particulado y CO2 finalizó de manera óptima.
                   </p>
                 </div>
               </div>

               <div className={cn(
                 "p-5 rounded-2xl text-center space-y-2",
                 theme === 'light' ? "bg-zinc-100" : "bg-[#111]"
               )}>
                 <span className="text-[9px] font-black text-[#0F766E] uppercase tracking-widest block">Simulador de Alertas UNL</span>
                 <p className="text-[10px] text-zinc-500 dynamic-pulse">
                   Pruebe la recepción enviando un pulso sintético al nodo IoT central.
                 </p>
                 <button
                   onClick={() => alert("Simulación de Alerta enviada exitosamente al hub académico UNL.")}
                   className="mt-2 bg-[#0F766E] hover:bg-[#0A524D] text-white text-[9.5px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all"
                 >
                   Disparar Alerta de Prueba
                 </button>
               </div>
            </motion.div>
          ) : view === 'upload' ? (
            <UploadPhotoView 
              key="upload"
              events={events}
              preSelectedEvent={uploadEvent}
              theme={theme}
              onBack={() => {
                setView(uploadEvent ? 'feed' : 'profile');
              }}
              onUploadSuccess={(imgBase64, eventId, caption) => {
                try {
                  const saved = localStorage.getItem('unl_user_uploads');
                  const currentPhotos = saved ? JSON.parse(saved) : [];
                  const updated = [imgBase64, ...currentPhotos];
                  localStorage.setItem('unl_user_uploads', JSON.stringify(updated));
                } catch {
                  // ignore
                }
                setView('profile');
              }}
            />
          ) : (
            <ProfileView 
              key="profile" 
              user={user} 
              onLogout={onLogout} 
              theme={theme} 
              onUploadClick={() => {
                setUploadEvent(null);
                setView('upload');
              }}
              onThemeToggle={onThemeToggle}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className={cn(
        "absolute bottom-0 left-0 right-0 z-50 border-t flex transition-all duration-300 ease-in-out shadow-lg transform",
        (view !== 'feed' || scrolled) ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-full opacity-0 pointer-events-none",
        theme === 'light' 
          ? "bg-white border-zinc-200" 
          : "bg-[#0d0d0d] border-[#222]"
      )}>
        <div className="grid grid-cols-5 w-full h-[72px]">
          <button 
            onClick={() => setView('feed')}
            className={cn(
              "flex flex-col items-center justify-center transition-all uppercase text-[9px] font-black tracking-widest gap-1 p-2",
              view === 'feed' 
                ? (theme === 'light' ? "bg-zinc-900 text-white" : "bg-white text-black") 
                : "text-zinc-500 hover:text-[#0F766E]"
            )}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[8px] font-black tracking-widest leading-none mt-0.5">Inicio</span>
          </button>
          
          <button 
            onClick={() => setView('weather')}
            className={cn(
              "flex flex-col items-center justify-center transition-all uppercase text-[9px] font-black tracking-widest gap-1 p-2",
              view === 'weather' 
                ? (theme === 'light' ? "bg-zinc-900 text-white" : "bg-white text-black") 
                : "text-zinc-500 hover:text-[#0F766E]"
            )}
          >
            <Droplets className="w-5 h-5" />
            <span className="text-[8px] font-black tracking-widest leading-none mt-0.5">Clima</span>
          </button>

          <button 
            onClick={() => setView('map')}
            className={cn(
              "flex flex-col items-center justify-center transition-all uppercase text-[9px] font-black tracking-widest gap-1 p-2",
              view === 'map' 
                ? (theme === 'light' ? "bg-zinc-900 text-white" : "bg-white text-black") 
                : "text-zinc-500 hover:text-[#0F766E]"
            )}
          >
            <MapIcon className="w-5 h-5" />
            <span className="text-[8px] font-black tracking-widest leading-none mt-0.5">Mapa</span>
          </button>

          <button 
            onClick={() => setView('notifications')}
            className={cn(
              "flex flex-col items-center justify-center transition-all uppercase text-[9px] font-black tracking-widest gap-1 p-2",
              view === 'notifications' 
                ? (theme === 'light' ? "bg-zinc-900 text-white" : "bg-white text-black") 
                : "text-zinc-500 hover:text-[#0F766E]"
            )}
          >
            <Bell className="w-5 h-5" />
            <span className="text-[8px] font-black tracking-widest leading-none mt-0.5">Alertas</span>
          </button>

          <button 
            onClick={() => setView('profile')}
            className={cn(
              "flex flex-col items-center justify-center transition-all uppercase text-[9px] font-black tracking-widest gap-1 p-2",
              view === 'profile' 
                ? (theme === 'light' ? "bg-zinc-900 text-white" : "bg-white text-black") 
                : "text-zinc-500 hover:text-[#0F766E]"
            )}
          >
            <User className="w-5 h-5" />
            <span className="text-[8px] font-black tracking-widest leading-none mt-0.5">Perfil</span>
          </button>
        </div>
      </nav>

      {/* Analysis Overlay */}
      <AnimatePresence>
        {(analyzing || analysisResult) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl p-10 flex flex-col justify-center items-center text-center"
          >
            {analyzing ? (
              <div className="space-y-8">
                <div className="relative w-32 h-32 mx-auto">
                   <div className="absolute inset-0 border-4 border-zinc-800 rounded-full" />
                   <div className="absolute inset-0 border-4 border-[#0F766E] border-t-transparent rounded-full animate-spin" />
                </div>
                <h3 className="text-3xl font-black italic uppercase tracking-tighter text-[#0F766E]">Sensing Campus...</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">Processing UNL node telemetry</p>
              </div>
            ) : (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-10 max-w-sm"
              >
                <div className="bg-[#111] p-8 border-2 border-[#222] text-center flex flex-col items-center relative">
                   <div className="absolute -top-6 bg-[#0F766E] text-white px-4 py-1 text-[10px] font-black uppercase tracking-widest">
                     UNL Sensing Report
                   </div>
                   <Activity className="w-12 h-12 text-[#0F766E] mb-6 mt-4" />
                   <div className="space-y-4">
                     <p className="text-xl font-bold uppercase tracking-tight leading-tight italic">{analysisResult}</p>
                     <div className="h-0.5 w-full bg-zinc-800" />
                     <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Cloud Node: unl-sensing-alpha-24</p>
                   </div>
                </div>
                <button 
                  onClick={() => setAnalysisResult(null)}
                  className="bg-[#0F766E] text-white px-12 py-4 font-black text-xs uppercase tracking-[0.3em] hover:scale-105 transition-transform"
                >
                  Continuar
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'mobile'>('dashboard');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info'; title?: string }>>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success', title?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Synthesize premium UI feedback chime using Web Audio API frequencies natively
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.35);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(75, audioCtx.currentTime + 0.25);
        gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.3);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.25);
      }
    } catch {
      // Browser secure context policy may prevent audio until click
    }

    setToasts([{ id, message, type, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Automatic routing based on user profile and role
  useEffect(() => {
    if (user) {
      // Default to the main desktop web dashboard for all logged-in profiles
      setActiveTab('dashboard');
    }
  }, [user]);

  const isAdminUser = user ? (user.name.toLowerCase().includes('isabel') || user.email?.toLowerCase().includes('isabel')) : false;

  // Dynamic stateful Events stream with persistent localStorage sync
  const [events, setEvents] = useState<Event[]>(() => {
    try {
      const saved = localStorage.getItem('unl_events_v2');
      return saved ? JSON.parse(saved) : MOCK_EVENTS;
    } catch {
      return MOCK_EVENTS;
    }
  });

  const handleAddNewEvent = (newEvent: Event) => {
    setEvents((prev) => {
      const updated = [newEvent, ...prev];
      try {
        localStorage.setItem('unl_events_v2', JSON.stringify(updated));
      } catch (e) {
        console.error("Error persisting dynamic events:", e);
      }
      return updated;
    });
    showToast(`Sensor/Evento "${newEvent.title}" registrado con éxito.`, 'success', 'Sonda Creada');
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents((prev) => {
      const target = prev.find(e => e.id === eventId);
      const updated = prev.filter(e => e.id !== eventId);
      try {
        localStorage.setItem('unl_events_v2', JSON.stringify(updated));
      } catch (e) {
        console.error("Error persisting dynamic events:", e);
      }
      const name = target?.title || "Sonda";
      showToast(`Sensor/Evento "${name}" removido correctamente.`, 'info', 'Sonda Removida');
      return updated;
    });
  };

  const handleLogout = () => {
    setUser(null);
    showToast(`Hasta luego, sesión finalizada correctamente.`, 'info', 'Hasta Pronto');
  };

  if (!user) {
    return (
      <LoginView 
        showToast={showToast}
        onLoginSuccess={(u) => {
          setUser(u);
          // Direct all active users to the gorgeous desktop web dashboard on login
          setActiveTab('dashboard');
          showToast(`¡Acceso verificado! Bienvenido ${u.name}.`, 'success', 'Acceso Otorgado');
        }} 
      />
    );
  }

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-300",
      theme === 'light' ? "bg-zinc-100/30" : "bg-[#050505]"
    )}>
      {/* Weather Emergency Alert Overlay */}
      <WeatherAlertOverlay />

      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
          >
            <DashboardView 
              user={user} 
              onLogout={handleLogout} 
              onSelectEvent={setSelectedEvent} 
              events={events}
              onAddEvent={handleAddNewEvent}
              onDeleteEvent={handleDeleteEvent}
              theme={theme} 
              onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              onSwitchToMobile={() => {
                setActiveTab('mobile');
                showToast("Sintonizando vista de dispositivo móvil...", "info", "Consola");
              }}
              showToast={showToast}
            />
          </motion.div>
        ) : (
          <motion.div
            key="mobile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
          >
            <MobileView 
              user={user} 
              onLogout={handleLogout} 
              onSelectEvent={setSelectedEvent} 
              events={events}
              theme={theme} 
              onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              onSwitchToDashboard={() => {
                setActiveTab('dashboard');
                showToast("Sintonizando consola principal de escritorio...", "info", "Consola");
              }}
              showToast={showToast}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Details Detailed View Modal */}
      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} theme={theme} />

      {/* Sleek, responsive, animation-rich push notification TOAST system */}
      <div className="fixed bottom-6 right-6 z-[999] p-4 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const isSuccess = toast.type === 'success';
            const isError = toast.type === 'error';
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 25, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className={cn(
                  "pointer-events-auto p-4 flex items-start gap-3.5 border shadow-2xl overflow-hidden relative font-sans transition-colors",
                  theme === 'light'
                    ? "bg-white text-zinc-800 border-zinc-250"
                    : "bg-[#0c0d12] text-[#f4f4f5] border-zinc-850"
                )}
              >
                {/* Visual accent left line indicator */}
                <div className={cn(
                  "absolute left-0 top-0 bottom-0 w-1",
                  isSuccess ? "bg-emerald-500" : isError ? "bg-rose-500" : "bg-[#0F766E]"
                )} />

                {/* Left side dynamic icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {isSuccess ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : isError ? (
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                  ) : (
                    <Info className="w-5 h-5 text-[#0F766E]" />
                  )}
                </div>

                {/* Middle details text block */}
                <div className="flex-1 min-w-0 pr-1 select-text">
                  {toast.title && (
                    <h5 className={cn(
                      "text-[9.5px] font-mono tracking-widest uppercase font-black mb-1",
                      isSuccess ? "text-emerald-500" : isError ? "text-rose-500" : "text-[#0F766E]"
                    )}>
                      {toast.title}
                    </h5>
                  )}
                  <p className="text-[11px] font-bold leading-normal leading-relaxed">
                    {toast.message}
                  </p>
                </div>

                {/* Manual close trigger button */}
                <button
                  type="button"
                  onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                  className="flex-shrink-0 text-zinc-400 hover:text-zinc-650 dark:hover:text-white transition-colors cursor-pointer p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
