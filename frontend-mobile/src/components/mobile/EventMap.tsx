import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Event } from '../../types';

// Fix for default marker icons in React Leaflet using robust CDN URLs
let DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface EventMapProps {
  events: Event[];
  center?: [number, number];
  zoom?: number;
  theme?: 'dark' | 'light';
}

const MapResizer = () => {
  const map = useMap();
  React.useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 250); // Delay to allow AnimatePresence transitions to settle
  }, [map]);
  return null;
};

export const EventMap: React.FC<EventMapProps> = ({ 
  events, 
  center = [-3.9931, -79.2042], 
  zoom = 14,
  theme = 'dark'
}) => {
  const [mapStyle, setMapStyle] = React.useState<'color' | 'dark'>(theme === 'light' ? 'color' : 'color');

  const tileUrl = mapStyle === 'color'
    ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    : "https://{s}.basemaps.cartocdb.com/dark_all/{z}/{x}/{y}{r}.png";

  return (
    <div className="w-full h-full overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">
      {/* Floating Style Controller */}
      <div className="absolute top-3 right-3 z-[1000] flex gap-1 bg-black/70 backdrop-blur-md p-1 border border-white/10 rounded shadow-lg">
        <button
          onClick={() => setMapStyle('color')}
          className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded transition-all ${
            mapStyle === 'color'
              ? 'bg-[#002f87] text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
          type="button"
        >
          Mapa Color
        </button>
        <button
          onClick={() => setMapStyle('dark')}
          className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded transition-all ${
            mapStyle === 'dark'
              ? 'bg-[#002f87] text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
          type="button"
        >
          Mapa Oscuro
        </button>
      </div>

      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%', background: mapStyle === 'color' ? '#e5e9f0' : '#0a0a0a' }}
        scrollWheelZoom={false}
      >
        <MapResizer />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={tileUrl}
          className="transition-all duration-300"
        />
        {events.map((event) => (
          <Marker 
            key={event.id} 
            position={[event.location.lat, event.location.lng]}
          >
            <Popup className="event-popup shadow-2xl">
              <div className={`p-3 min-w-[200px] ${theme === 'light' ? 'bg-white text-zinc-900' : 'bg-[#111] text-white'}`}>
                <div className="flex justify-between items-start mb-2">
                   <span className="text-[9px] font-black uppercase tracking-tighter bg-[#002f87] text-white px-2 py-0.5">Live Zone</span>
                   <span className="text-[9px] font-mono text-zinc-500">ID: {event.id.slice(0, 4)}</span>
                </div>
                <h4 className={`font-black uppercase tracking-tighter text-lg leading-none mb-1 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{event.title}</h4>
                <p className="text-[10px] text-zinc-550 uppercase font-bold tracking-widest mb-4">{event.location.name}</p>
                <div className={`flex justify-between items-center pt-2 border-t ${theme === 'light' ? 'border-zinc-200' : 'border-zinc-800'}`}>
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#002f87]">
                    {event.category}
                  </span>
                  <span className={`text-[10px] font-black italic ${theme === 'light' ? 'text-zinc-700' : 'text-white'}`}>
                    SENSING: {event.attendeesCount}+
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
