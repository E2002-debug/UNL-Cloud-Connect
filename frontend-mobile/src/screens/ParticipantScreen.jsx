// Autor: David Guamán
// Fecha: 27/06/2026
// Version: 0.1
// Historial:
// 27/06/2026 v0.1 - David Guamán: Creación del feed de participantes con filtrado por estados (chips), insignias de estado, clima en tiempo real integrado al lado del estado, likes/dislikes directos en tarjetas, reubicación del botón a un enlace inline de incentivo "Ver y aportar" y rediseño del Perfil con avatar de iniciales y menú de soporte.

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  FlatList, 
  Image, 
  ActivityIndicator, 
  Alert, 
  TextInput, 
  Platform,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Camera, 
  Image as ImageIcon, 
  MapPin, 
  User, 
  LogOut, 
  CloudRain, 
  Sun, 
  Bell, 
  Calendar, 
  Info, 
  Check, 
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  X,
  Shield
} from 'lucide-react-native';
import { getEventos, getClimaActual, setAuthHeaders, reaccionarAImagen, obtenerReaccionesImagen } from '../services/api';

export default function ParticipantScreen({ route, navigation }) {
  const { user } = route.params || { user: { name: 'Invitado', email: 'invitado@unl.edu.ec', id_usuario: 1, id_rol: 2 } };
  
  // Set headers on API client for this session
  useEffect(() => {
    if (user && user.token) {
      setAuthHeaders(user.id_usuario, user.id_rol, user.token);
    } else {
      setAuthHeaders(user.id_usuario, user.id_rol, null);
    }
  }, [user]);

  // Tab navigation: 'feed' | 'weather' | 'profile'
  const [activeTab, setActiveTab] = useState('feed');
  
  // Feed States
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('TODOS');
  const [eventsReactions, setEventsReactions] = useState({});
  
  // Weather States
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  // Fullscreen Image States
  const [fullscreenImage, setFullscreenImage] = useState(null);

  // Load Initial Data
  useEffect(() => {
    loadEvents();
    loadWeather();
  }, []);

  const loadEvents = async () => {
    try {
      setLoadingEvents(true);
      const data = await getEventos();
      setEvents(data);

      // Fetch reactions for the cover image of each event in parallel
      const reactionsData = {};
      await Promise.all(
        data.map(async (evt) => {
          const coverImg = evt.imagenes?.find(img => img.id_usuario === evt.id_usuario);
          if (coverImg) {
            try {
              const res = await obtenerReaccionesImagen(coverImg.id_imagen);
              reactionsData[coverImg.id_imagen] = res;
            } catch (err) {
              console.error(`Error loading reactions for cover image ${coverImg.id_imagen}:`, err);
            }
          }
        })
      );
      setEventsReactions(reactionsData);
    } catch (err) {
      console.error('Error al cargar eventos:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const loadWeather = async () => {
    try {
      setLoadingWeather(true);
      const data = await getClimaActual();
      setWeather(data);
    } catch (err) {
      console.error('Error al cargar clima:', err);
    } finally {
      setLoadingWeather(false);
    }
  };

  const handleFeedReaction = async (idImagen, tipo) => {
    try {
      const currentReactions = eventsReactions[idImagen] || {
        total_me_gusta: 0,
        total_no_me_gusta: 0,
        usuarios_me_gusta: [],
        usuarios_no_me_gusta: []
      };

      const userId = user.id_usuario;
      const alreadyLiked = currentReactions.usuarios_me_gusta.includes(userId);
      const alreadyDisliked = currentReactions.usuarios_no_me_gusta.includes(userId);

      let updatedMeGusta = [...currentReactions.usuarios_me_gusta];
      let updatedNoMeGusta = [...currentReactions.usuarios_no_me_gusta];

      if (tipo === 'ME_GUSTA') {
        if (alreadyLiked) {
          updatedMeGusta = updatedMeGusta.filter(id => id !== userId);
        } else {
          updatedMeGusta.push(userId);
          updatedNoMeGusta = updatedNoMeGusta.filter(id => id !== userId);
        }
      } else if (tipo === 'NO_ME_GUSTA') {
        if (alreadyDisliked) {
          updatedNoMeGusta = updatedNoMeGusta.filter(id => id !== userId);
        } else {
          updatedNoMeGusta.push(userId);
          updatedMeGusta = updatedMeGusta.filter(id => id !== userId);
        }
      }

      setEventsReactions(prev => ({
        ...prev,
        [idImagen]: {
          total_me_gusta: updatedMeGusta.length,
          total_no_me_gusta: updatedNoMeGusta.length,
          usuarios_me_gusta: updatedMeGusta,
          usuarios_no_me_gusta: updatedNoMeGusta
        }
      }));

      await reaccionarAImagen(idImagen, tipo);

      const freshReactions = await obtenerReaccionesImagen(idImagen);
      setEventsReactions(prev => ({
        ...prev,
        [idImagen]: freshReactions
      }));
    } catch (err) {
      console.error('Error reacting to cover image:', err);
    }
  };


  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', onPress: () => navigation.replace('Login') }
    ]);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Hoy';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateStr;
    }
  };

  const renderStatusBadge = (estado) => {
    let bg = '#F3F4F6';
    let color = '#4B5563';
    let label = estado || 'Desconocido';

    switch (estado) {
      case 'PROGRAMADO':
        bg = '#E0F2FE';
        color = '#0369A1';
        label = 'Programado';
        break;
      case 'EN_PROGRESO':
        bg = '#DCFCE7';
        color = '#15803D';
        label = 'En Progreso';
        break;
      case 'FINALIZADO':
        bg = '#F3F4F6';
        color = '#4B5563';
        label = 'Finalizado';
        break;
      case 'CANCELADO':
        bg = '#FEE2E2';
        color = '#B91C1C';
        label = 'Cancelado';
        break;
      default:
        break;
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: bg }]}>
        <Text style={[styles.statusBadgeText, { color: color }]}>{label}</Text>
      </View>
    );
  };

  const renderFilterBar = () => {
    const filters = [
      { key: 'TODOS', label: 'Todos' },
      { key: 'EN_PROGRESO', label: 'En Progreso' },
      { key: 'PROGRAMADO', label: 'Programados' },
      { key: 'FINALIZADO', label: 'Finalizados' },
      { key: 'CANCELADO', label: 'Cancelados' }
    ];

    return (
      <View style={styles.filterBarContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterBarContent}
        >
          {filters.map((f) => {
            const isActive = selectedStatusFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setSelectedStatusFilter(f.key)}
                style={[
                  styles.filterPill,
                  isActive && styles.filterPillActive
                ]}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.filterPillText,
                  isActive && styles.filterPillTextActive
                ]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // Render Functions
  const renderFeed = () => {
    if (loadingEvents) {
      return <ActivityIndicator size="large" color="#0F766E" style={styles.centerLoader} />;
    }

    let filteredEvents = events.filter((evt) => {
      if (selectedStatusFilter === 'TODOS') return true;
      return evt.estado === selectedStatusFilter;
    });

    if (selectedStatusFilter === 'TODOS') {
      const statusPriority = {
        'EN_PROGRESO': 1,
        'PROGRAMADO': 2,
        'FINALIZADO': 3,
        'CANCELADO': 4
      };

      filteredEvents.sort((a, b) => {
        const priorityA = statusPriority[a.estado] || 99;
        const priorityB = statusPriority[b.estado] || 99;
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        return new Date(b.fecha_hora_inicio) - new Date(a.fecha_hora_inicio);
      });
    }

    return (
      <View style={{ flex: 1 }}>
        {renderFilterBar()}
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => String(item.id_evento)}
          contentContainerStyle={styles.listContainer}
          refreshing={loadingEvents}
          onRefresh={loadEvents}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Info size={40} color="#9CA3AF" />
              <Text style={styles.emptyText}>No hay eventos en este estado en este momento.</Text>
            </View>
          }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.eventCard}
            onPress={() => navigation.navigate('EventDetail', { eventId: item.id_evento, user })}
            activeOpacity={0.85}
          >
            <View style={styles.eventHeader}>
              <View style={styles.eventMeta}>
                <Text style={styles.eventDate}>
                  <Calendar size={13} color="#6B7280" /> {formatDate(item.fecha_hora_inicio)}
                </Text>
                <Text style={styles.eventLocation}>
                  <MapPin size={13} color="#6B7280" /> {item.ubicacion?.nombre_lugar || 'Campus Central'}
                </Text>
                {renderStatusBadge(item.estado)}
                {weather && (
                  <View style={[
                    styles.weatherBadge, 
                    weather.temperatura <= 22 && { backgroundColor: '#E0F2FE', borderColor: '#BAE6FD' }
                  ]}>
                    {weather.temperatura > 22 ? (
                      <Sun size={12} color="#D97706" />
                    ) : (
                      <CloudRain size={12} color="#0369A1" />
                    )}
                    <Text style={[
                      styles.weatherTempText,
                      weather.temperatura <= 22 && { color: '#0369A1' }
                    ]}>
                      {weather.temperatura}°C
                    </Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.eventTitle} numberOfLines={2}>{item.nombre}</Text>
              <Text style={styles.eventDesc} numberOfLines={2}>{item.descripcion}</Text>
              <View style={styles.moreDetailsContainer}>
                <Text style={styles.moreDetailsText}>Ver y aportar</Text>
              </View>
            </View>

            {/* Display the uploaded image for this event */}
            {item.imagen_url ? (
              <View style={styles.imageCardContainer}>
                <TouchableOpacity 
                  onPress={() => setFullscreenImage(item.imagen_url)}
                  activeOpacity={0.9}
                >
                  <View style={styles.singleImageCard}>
                    <Image source={{ uri: item.imagen_url }} style={styles.eventImageFull} />
                  </View>
                </TouchableOpacity>
                {(() => {
                  const coverImg = item.imagenes?.find(img => img.id_usuario === item.id_usuario);
                  if (!coverImg) return null;

                  const imgReactions = eventsReactions[coverImg.id_imagen] || {
                    total_me_gusta: 0,
                    total_no_me_gusta: 0,
                    usuarios_me_gusta: [],
                    usuarios_no_me_gusta: []
                  };

                  const isLiked = imgReactions.usuarios_me_gusta.includes(user.id_usuario);
                  const isDisliked = imgReactions.usuarios_no_me_gusta.includes(user.id_usuario);

                  return (
                    <View style={styles.feedReactionsBar}>
                      <TouchableOpacity 
                        style={[styles.feedReactionBtn, isLiked && styles.reactionBtnActiveLike]}
                        onPress={() => handleFeedReaction(coverImg.id_imagen, 'ME_GUSTA')}
                        activeOpacity={0.7}
                      >
                        <ThumbsUp size={13} color={isLiked ? '#fff' : '#6B7280'} />
                        <Text style={[styles.feedReactionCount, isLiked && styles.reactionTextActive]}>
                          {imgReactions.total_me_gusta} Me gusta
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[styles.feedReactionBtn, isDisliked && styles.reactionBtnActiveDislike]}
                        onPress={() => handleFeedReaction(coverImg.id_imagen, 'NO_ME_GUSTA')}
                        activeOpacity={0.7}
                      >
                        <ThumbsDown size={13} color={isDisliked ? '#fff' : '#6B7280'} />
                        <Text style={[styles.feedReactionCount, isDisliked && styles.reactionTextActive]}>
                          {imgReactions.total_no_me_gusta} No me gusta
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })()}
              </View>
            ) : (
              <View style={styles.noImagesCard}>
                <Text style={styles.noImagesText}>Este evento aún no cuenta con fotos de evidencia.</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
      </View>
    );
  };

  const renderWeather = () => {
    if (loadingWeather) {
      return <ActivityIndicator size="large" color="#0F766E" style={styles.centerLoader} />;
    }

    return (
      <View style={styles.weatherContainer}>
        <View style={styles.weatherCard}>
          <Text style={styles.weatherTitle}>Estación Loja Clima</Text>
          <Text style={styles.weatherTime}>Sintonizado en tiempo real</Text>

          {weather ? (
            <View style={styles.weatherDetails}>
              <Sun size={64} color="#F59E0B" style={styles.weatherIcon} />
              <Text style={styles.tempText}>{weather.temp ? `${weather.temp.toFixed(1)}°C` : '18.5°C'}</Text>
              <Text style={styles.descText}>{weather.description || 'Despejado / Soleado'}</Text>
              
              <View style={styles.weatherMetaGrid}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Humedad</Text>
                  <Text style={styles.metaVal}>{weather.humidity ? `${weather.humidity}%` : '62%'}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Viento</Text>
                  <Text style={styles.metaVal}>{weather.wind_speed ? `${weather.wind_speed} m/s` : '3.1 m/s'}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.weatherEmpty}>
              <CloudRain size={40} color="#9CA3AF" />
              <Text style={styles.weatherEmptyText}>Estación fuera de línea temporalmente. Mostrando datos promedio (18.5°C, Nubosidad moderada).</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const getInitials = (name) => {
    if (!name) return 'UN';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const renderProfile = () => {
    return (
      <ScrollView contentContainerStyle={styles.profileScrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarBorder}>
              <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
            </View>
            <View style={styles.onlineBadge} />
          </View>

          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>

          <View style={styles.badgeRow}>
            <Text style={styles.roleBadge}>Participante Acreditado</Text>
          </View>

          <View style={styles.profileStats}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>Activo</Text>
              <Text style={styles.statLabel}>Estado</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>Kong</Text>
              <Text style={styles.statLabel}>Gateway</Text>
            </View>
          </View>

          {/* Settings / Information Menu */}
          <View style={styles.settingsMenu}>
            <Text style={styles.settingsSectionTitle}>Ajustes y Soporte</Text>
            
            <TouchableOpacity style={styles.settingsItem} activeOpacity={0.7} onPress={() => Alert.alert('Notificaciones', 'Configuración de notificaciones en desarrollo.')}>
              <View style={styles.settingsItemLeft}>
                <View style={[styles.settingsIconContainer, { backgroundColor: '#E0F2FE' }]}>
                  <Bell size={18} color="#0369A1" />
                </View>
                <Text style={styles.settingsItemText}>Notificaciones</Text>
              </View>
              <Text style={styles.settingsItemArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingsItem} activeOpacity={0.7} onPress={() => Alert.alert('Privacidad', 'UNL Cloud Connect protege tus datos bajo los lineamientos institucionales.')}>
              <View style={styles.settingsItemLeft}>
                <View style={[styles.settingsIconContainer, { backgroundColor: '#FEE2E2' }]}>
                  <Shield size={18} color="#B91C1C" />
                </View>
                <Text style={styles.settingsItemText}>Seguridad y Privacidad</Text>
              </View>
              <Text style={styles.settingsItemArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingsItem} activeOpacity={0.7} onPress={() => Alert.alert('Soporte', 'Para soporte técnico, escribe a: soporte.cloudconnect@unl.edu.ec')}>
              <View style={styles.settingsItemLeft}>
                <View style={[styles.settingsIconContainer, { backgroundColor: '#E6F4F1' }]}>
                  <Info size={18} color="#0F766E" />
                </View>
                <Text style={styles.settingsItemText}>Soporte Técnico</Text>
              </View>
              <Text style={styles.settingsItemArrow}>→</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={16} color="#fff" style={styles.logoutIcon} />
            <Text style={styles.logoutBtnText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      {/* App Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>UNL <Text style={styles.headerHighlight}>Cloud Connect</Text></Text>
        </View>
        <TouchableOpacity style={styles.bellBtn}>
          <Bell size={20} color="#0F766E" />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {activeTab === 'feed' && renderFeed()}
        {activeTab === 'weather' && renderWeather()}
        {activeTab === 'profile' && renderProfile()}
      </View>

      {/* Custom Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {[
          { id: 'feed', label: 'Feed', icon: Calendar },
          { id: 'weather', label: 'Clima', icon: CloudRain },
          { id: 'profile', label: 'Perfil', icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity 
              key={tab.id}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.id)}
            >
              <Icon size={20} color={isActive ? '#0F766E' : '#9CA3AF'} />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Fullscreen Image Viewer Modal */}
      <Modal
        visible={!!fullscreenImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullscreenImage(null)}
      >
        <View style={styles.fullscreenContainer}>
          <TouchableOpacity 
            style={styles.fullscreenCloseBtn}
            onPress={() => setFullscreenImage(null)}
            activeOpacity={0.8}
          >
            <X size={24} color="#fff" />
          </TouchableOpacity>
          
          {fullscreenImage && (
            <Image 
              source={{ uri: fullscreenImage }} 
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  profileScrollContainer: {
    padding: 16,
  },
  profileContainer: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarBorder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#E6F4F1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '850',
    color: '#111827',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  roleBadge: {
    backgroundColor: '#E6F4F1',
    color: '#0F766E',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  profileStats: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    marginBottom: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  settingsMenu: {
    width: '100%',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    marginBottom: 16,
  },
  settingsSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  settingsItemArrow: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '700',
  },
  safeContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  headerSubtitle: {
    fontSize: 9,
    fontWeight: '900',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1F2937',
  },
  headerHighlight: {
    color: '#0F766E',
  },
  bellBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  mainContent: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  centerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  eventHeader: {
    marginBottom: 12,
  },
  eventMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  eventDate: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '700',
  },
  eventLocation: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '700',
  },
  floatingWeatherBadge: {
    display: 'none',
  },
  floatingWeatherTemp: {
    display: 'none',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  weatherTempText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  eventDesc: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  imageScroll: {
    flexDirection: 'row',
    marginTop: 8,
  },
  imageCard: {
    width: 120,
    height: 90,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  eventImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  noImagesCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    marginTop: 4,
  },
  noImagesText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  cardUploadBtnLink: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#E6F4F1',
    marginTop: 8,
  },
  cardUploadBtnLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
  },
  statusBadgeText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#0F766E',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 20,
    zIndex: 10,
  },
  fullscreenImage: {
    width: '100%',
    height: '80%',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
    paddingVertical: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#0F766E',
    fontWeight: '800',
  },
  scrollContainer: {
    padding: 16,
  },
  uploadCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F766E',
    textAlign: 'center',
    marginBottom: 4,
  },
  tabSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  dropdown: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    padding: 4,
    marginBottom: 20,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  dropdownItemActive: {
    backgroundColor: '#E6F4F1',
  },
  dropdownText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  dropdownTextActive: {
    color: '#0F766E',
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  cameraBtn: {
    flex: 1,
    backgroundColor: '#0F766E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cameraBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  galleryBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#0F766E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  galleryBtnText: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '700',
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    aspectRatio: 4/3,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  clearImageBtn: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  clearImageText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  loader: {
    marginVertical: 16,
  },
  weatherContainer: {
    padding: 16,
    flex: 1,
    justifyContent: 'center',
  },
  weatherCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  weatherTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F766E',
  },
  weatherTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 20,
  },
  weatherDetails: {
    alignItems: 'center',
    width: '100%',
  },
  weatherIcon: {
    marginBottom: 8,
  },
  tempText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#1F2937',
    letterSpacing: -1,
  },
  descText: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '600',
    textTransform: 'capitalize',
    marginBottom: 24,
  },
  weatherMetaGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
    width: '100%',
  },
  metaCol: {
    flex: 1,
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 4,
  },
  metaVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  weatherEmpty: {
    alignItems: 'center',
    padding: 20,
  },
  weatherEmptyText: {
    marginTop: 12,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  profileContainer: {
    padding: 16,
    flex: 1,
    justifyContent: 'center',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarBorder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 12,
  },
  badgeRow: {
    marginBottom: 20,
  },
  roleBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
    backgroundColor: '#E6F4F1',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  profileStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    paddingVertical: 16,
    width: '100%',
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  singleImageCard: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
  },
  eventImageFull: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  moreDetailsContainer: {
    marginTop: 4,
  },
  moreDetailsText: {
    fontSize: 9.5,
    color: '#0F766E',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  filterBarContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
  },
  filterBarContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterPillActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  filterPillTextActive: {
    color: '#fff',
  },
  imageCardContainer: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  feedReactionsBar: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  feedReactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  feedReactionCount: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '600',
  },
  reactionBtnActiveLike: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  reactionBtnActiveDislike: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  reactionTextActive: {
    color: '#fff',
  },
});
