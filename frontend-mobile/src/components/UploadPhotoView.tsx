import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Cloud, Camera, Image as ImageIcon, Calendar, 
  ChevronDown, X, Globe, Lightbulb, Check, AlertCircle 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Event } from '../types';

interface UploadPhotoViewProps {
  key?: React.Key;
  events: Event[];
  preSelectedEvent: Event | null;
  theme?: 'dark' | 'light';
  onBack: () => void;
  onUploadSuccess: (imgBase64: string, eventId: string, caption: string) => void;
}

export default function UploadPhotoView({
  events,
  preSelectedEvent,
  theme = 'dark',
  onBack,
  onUploadSuccess,
}: UploadPhotoViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(preSelectedEvent || events[0] || null);
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const [caption, setCaption] = useState('');
  const [visibleToPublic, setVisibleToPublic] = useState(true);
  
  // Simulated uploaded photo base64
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Default beautiful stock photo options to simulate gallery selection
  const stockPhotoOptions = [
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=600'
  ];

  // Pick a random stock image to simulate a capture/select if no file is provided
  const handleSimulatedImage = () => {
    const randomImg = stockPhotoOptions[Math.floor(Math.random() * stockPhotoOptions.length)];
    setSelectedImage(randomImg);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setError('El archivo debe ser una imagen válida.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          setSelectedImage(base64);
          setError(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    if (!selectedImage) {
      setError('Por favor, seleccione o tome una foto primero.');
      return;
    }
    if (!selectedEvent) {
      setError('Por favor, asocie la foto con un evento.');
      return;
    }

    // Pass back base64 image and trigger success transition
    onUploadSuccess(selectedImage, selectedEvent.id, caption);
  };

  // Convert "Feria de Ciencias" -> "#FeriaDeCiencias"
  const getHashtag = (title: string) => {
    const cleaned = title
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
      .replace(/\s+/g, '');
    return `#${cleaned}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="p-6 space-y-6 pb-32 max-w-md mx-auto relative text-center"
    >
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Header Bar matching Reference 3 */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-150 dark:border-zinc-800">
        <button 
          onClick={onBack}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-[#0F766E] dark:text-[#5890ff]" />
        </button>
        <h2 className={cn(
          "text-lg font-black uppercase tracking-wider",
          theme === 'light' ? "text-[#0F766E]" : "text-white"
        )}>
          Subir Foto
        </h2>
        <button 
          onClick={handleUpload}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors text-[#0F766E] dark:text-[#5890ff] cursor-pointer"
        >
          <Cloud className="w-5 h-5" />
        </button>
      </div>

      {/* Main Container "Ready to share?" */}
      <div className={cn(
        "rounded-3xl border p-6 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 shadow-sm",
        theme === 'light' 
          ? "bg-[#fafbff] border-zinc-200/80" 
          : "bg-[#0c0d12] border-zinc-800"
      )}>
        {selectedImage ? (
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden group shadow-md border dark:border-zinc-855 mb-4">
            <img 
              src={selectedImage} 
              referrerPolicy="no-referrer"
              alt="Preview" 
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white hover:text-red-500 rounded-full transition-colors cursor-pointer"
              title="Quitar Foto"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[9.5px] font-bold text-white uppercase tracking-wider">
              Vista Previa
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {/* Visual Header Grid Icon */}
            <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center mb-4 border border-blue-100/50">
              <Camera className="w-7 h-7 text-[#0F766E] dark:text-blue-400" />
            </div>

            <h3 className={cn(
              "text-lg font-extrabold tracking-tight",
              theme === 'light' ? "text-[#0F766E]" : "text-white"
            )}>
              ¿Listo para compartir?
            </h3>
            <p className="text-zinc-500 text-xs mt-2 max-w-[280px] text-center leading-relaxed">
              Sube tus fotos a los eventos del campus para contribuir a la galería pública de la comunidad.
            </p>
          </div>
        )}

        {/* Share/Actions buttons */}
        <div className="w-full flex flex-col items-center gap-2.5 mt-5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-[280px] bg-[#0F766E] hover:bg-[#0A524D] text-white font-extrabold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md dark:shadow-none cursor-pointer"
          >
            <ImageIcon className="w-4 h-4" />
            Seleccionar de Galería
          </button>
          
          <button
            onClick={handleSimulatedImage}
            className={cn(
              "w-full max-w-[280px] border font-extrabold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer",
              theme === 'light'
                ? "bg-white border-zinc-200 text-[#0F766E] hover:bg-zinc-50"
                : "bg-zinc-900/40 border-zinc-800 text-white hover:bg-zinc-900/80"
            )}
          >
            <Camera className="w-4 h-4 text-[#0F766E] dark:text-blue-400" />
            Tomar Foto
          </button>
        </div>
      </div>

      {/* Post Details header */}
      <div className="text-left space-y-4">
        <div className="flex items-center gap-2.5 pb-1 pl-1">
          <div className="w-1.5 h-6 bg-[#0F766E] rounded-full" />
          <h3 className={cn(
            "text-lg font-black uppercase tracking-tight",
            theme === 'light' ? "text-[#0F766E]" : "text-white"
          )}>
            Detalles de Publicación
          </h3>
        </div>

        {/* Event Selection dropdown container */}
        <div className="space-y-1.5 relative">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#0F766E] dark:text-zinc-400 pl-1 block">
            Asociar con Evento
          </label>
          <button
            type="button"
            onClick={() => setShowEventDropdown(!showEventDropdown)}
            className={cn(
              "w-full p-4 rounded-2xl border flex items-center justify-between text-left transition-colors cursor-pointer",
              theme === 'light' 
                ? "bg-white border-zinc-200 text-zinc-800" 
                : "bg-[#0d0d0d] border-zinc-800 text-zinc-350"
            )}
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#0F766E] dark:text-blue-400" />
              <span className="text-xs font-semibold">
                {selectedEvent ? selectedEvent.title : 'Buscar eventos del campus...'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          </button>

          {/* Hashtag Tag block */}
          {selectedEvent && (
            <div className="flex items-center gap-1.5 mt-2 pl-0.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold bg-indigo-50 dark:bg-zinc-900 text-[#0F766E] dark:text-blue-300 rounded-full border border-indigo-100/30 dark:border-zinc-800">
                {getHashtag(selectedEvent.title)}
                <X 
                  onClick={() => setSelectedEvent(null)}
                  className="w-3.5 h-3.5 text-zinc-400 hover:text-red-500 cursor-pointer" 
                />
              </span>
            </div>
          )}

          {/* Event Dropdown overlay */}
          {showEventDropdown && (
            <div className={cn(
              "absolute top-full left-0 right-0 z-50 mt-2 border rounded-2xl divide-y max-h-56 overflow-y-auto shadow-xl transition-colors",
              theme === 'light' ? "bg-white border-zinc-200 divide-zinc-100" : "bg-[#0d0d0d] border-zinc-800 divide-zinc-850"
            )}>
              {events.map((evt) => (
                <button
                  key={evt.id}
                  type="button"
                  onClick={() => {
                    setSelectedEvent(evt);
                    setShowEventDropdown(false);
                  }}
                  className={cn(
                    "w-full p-3.5 text-left text-xs font-bold transition-colors flex justify-between items-center cursor-pointer",
                    theme === 'light' ? "hover:bg-zinc-50" : "hover:bg-zinc-900",
                    selectedEvent?.id === evt.id ? "text-[#0F766E]" : (theme === 'light' ? "text-zinc-700" : "text-zinc-300")
                  )}
                >
                  <span>{evt.title}</span>
                  {selectedEvent?.id === evt.id && <Check className="w-4 h-4 text-[#0F766E]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Caption entry block */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#0F766E] dark:text-zinc-400 pl-1 block">
            Leyenda o Descripción
          </label>
          <div className="relative">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, 250))}
              placeholder="Cuéntanos sobre este momento..."
              rows={4}
              className={cn(
                "w-full p-4 rounded-2xl border text-xs focus:ring-1 focus:ring-[#0F766E] outline-none transition-colors",
                theme === 'light' 
                  ? "bg-white border-zinc-200 text-zinc-800 placeholder-zinc-400" 
                  : "bg-[#0d0d0d] border-zinc-800 text-white placeholder-zinc-650"
              )}
            />
            <span className="absolute bottom-3 right-4 text-[9px] font-mono text-zinc-400">
              {caption.length} / 250 caracteres
            </span>
          </div>
        </div>

        {/* Toggle option Block */}
        <div className={cn(
          "rounded-2xl border p-4 flex items-center justify-between transition-colors",
          theme === 'light' ? "bg-zinc-50 border-zinc-200" : "bg-[#0d0d0d] border-zinc-800"
        )}>
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-[#0F766E] dark:text-blue-400" />
            <div className="text-left">
              <span className={cn("text-xs font-black uppercase tracking-tight block", theme === 'light' ? "text-zinc-800" : "text-white")}>
                Visible al Público
              </span>
              <span className="text-[9.5px] text-zinc-400 font-medium block">
                Compartido en la galería del evento
              </span>
            </div>
          </div>
          <button
            onClick={() => setVisibleToPublic(!visibleToPublic)}
            className={cn(
              "w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer flex items-center",
              visibleToPublic ? "bg-[#0F766E] dark:bg-blue-605" : "bg-zinc-300 dark:bg-zinc-800"
            )}
          >
            <div className={cn(
              "bg-white w-5 h-5 rounded-full shadow transition-transform",
              visibleToPublic ? "translate-x-5" : "translate-x-0"
            )} />
          </button>
        </div>

        {/* Final Upload trigger block */}
        <div className="pt-2">
          {error && (
            <div className="flex items-center gap-1.5 text-[9.5px] font-mono font-bold uppercase text-red-500 p-2.5 bg-red-500/5 border border-red-500/10 mb-3 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleUpload}
            className="w-full bg-[#0F766E] hover:bg-[#0A524D] text-white font-extrabold text-sm uppercase tracking-widest py-4 rounded-2xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            Subir a la nube
          </button>
          <span className="text-[9.5px] text-zinc-450 block text-center mt-3 leading-relaxed">
            Al subir esta foto, aceptas la Política de Medios del Campus.
          </span>
        </div>

        {/* Photography Tip */}
        <div className={cn(
          "p-5 flex gap-4 items-start mt-5 border transition-all duration-300 relative overflow-hidden",
          theme === 'light' 
            ? "bg-zinc-100 border-zinc-200 text-zinc-800"
            : "bg-[#111116] border-zinc-850 text-zinc-100"
        )}>
          {/* Subtle decorative glow line */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0F766E]" />
          
          <Lightbulb className={cn(
            "w-5 h-5 flex-shrink-0 mt-0.5",
            theme === 'light' ? "text-[#0F766E]" : "text-blue-400"
          )} />
          <div className="text-left font-sans">
            <h4 className={cn(
              "text-[10px] font-mono font-black uppercase tracking-widest",
              theme === 'light' ? "text-[#0F766E]" : "text-blue-400"
            )}>
              Consejo de Fotografía
            </h4>
            <p className={cn(
              "text-[10.5px] leading-relaxed mt-1 font-semibold",
              theme === 'light' ? "text-zinc-700" : "text-zinc-300"
            )}>
              Las fotos con luz natural alta suelen tener más reconocimiento e interactividad en los resúmenes de eventos.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
