// Autor: David Guamán
// Fecha: 27/06/2026
// Version: 0.1
// Historial:
// 27/06/2026 v0.1 - David Guamán: Creación del feed de participantes con filtrado por estados (chips), insignias de estado, clima en tiempo real integrado al lado del estado, likes/dislikes directos en tarjetas, reubicación del botón a un enlace inline de incentivo "Ver y aportar" y rediseño del Perfil con avatar de iniciales y menú de soporte.

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Image, Dimensions, ScrollView, Modal, Alert, Platform, ActivityIndicator, TextInput, KeyboardAvoidingView, ImageBackground, Switch, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  Shield,
  Thermometer,
  Droplets,
  Wind,
  ChevronRight,
  BadgeCheck,
  Mail,
  Save,
  ShieldCheck,
  Lock,
  Clock,
  FileText,
  Copy,
  UserCog,
  Headset,
  MessageSquare,
  HelpCircle,
  Search,
  Map
} from 'lucide-react-native';
import { getEventos, getClimaActual, setAuthHeaders, reaccionarAImagen, obtenerReaccionesImagen, uploadImage } from '../services/api';
import { getLojaWeather } from '../services/weatherService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const showPushNotification = async (title, body) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
    },
    trigger: null,
  });
};

const { width } = Dimensions.get('window');

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
  const [loadingMoreEvents, setLoadingMoreEvents] = useState(false);
  const [hasMoreEvents, setHasMoreEvents] = useState(true);
  const [eventsSkip, setEventsSkip] = useState(0);
  const EVENTS_LIMIT = 10;
  
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('TODOS');
  const [eventsReactions, setEventsReactions] = useState({});
  
  // Weather States
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  // Fullscreen Image States
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  
  // Settings States
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [faqModalVisible, setFaqModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load Initial Data
  useEffect(() => {
    loadEvents();
    loadWeather();
  }, []);

  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      const newAlert = {
        id: String(Date.now()),
        title: notification.request.content.title || 'Alerta del Sistema',
        description: notification.request.content.body || 'Tienes una nueva notificación.',
        time: 'Ahora',
        icon: Bell,
        color: '#0F766E',
        unread: true
      };
      setAlerts(prev => [newAlert, ...prev]);
    });
    return () => subscription.remove();
  }, []);

  // Función auxiliar para forzar alertas en Web donde expo-notifications está limitado
  const triggerSimulatedAlert = (title, body) => {
    if (Platform.OS !== 'web') {
      showPushNotification(title, body);
    } else {
      // Force append to state on Web
      setAlerts(prev => [{
        id: String(Date.now()),
        title,
        description: body,
        time: 'Ahora',
        icon: Bell,
        color: '#0F766E',
        unread: true
      }, ...prev]);
      Alert.alert(title, body);
    }
  };

  // Funciones de simulación locales removidas en favor del sistema Push real de Backend

  const fetchReactionsForEvents = async (data, resetReactions = false) => {
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
    if (resetReactions) {
      setEventsReactions(reactionsData);
    } else {
      setEventsReactions(prev => ({ ...prev, ...reactionsData }));
    }
  };

  const loadEvents = async () => {
    try {
      setLoadingEvents(true);
      setEventsSkip(0);
      setHasMoreEvents(true);
      
      const data = await getEventos(0, EVENTS_LIMIT);
      
      if (data.length < EVENTS_LIMIT) setHasMoreEvents(false);
      
      setEvents(data);
      AsyncStorage.setItem('cached_events', JSON.stringify(data)).catch(() => {});
      await fetchReactionsForEvents(data, true);
    } catch (err) {
      console.error('Error al cargar eventos:', err);
      // OFFLINE MODE FALLBACK
      try {
        const cached = await AsyncStorage.getItem('cached_events');
        if (cached) {
          setEvents(JSON.parse(cached));
          Alert.alert('Modo Offline', 'Mostrando eventos guardados sin conexión.');
        }
      } catch (e) {}
    } finally {
      setLoadingEvents(false);
    }
  };

  const loadMoreEvents = async () => {
    if (loadingMoreEvents || !hasMoreEvents || loadingEvents) return;
    
    try {
      setLoadingMoreEvents(true);
      const nextSkip = eventsSkip + EVENTS_LIMIT;
      const data = await getEventos(nextSkip, EVENTS_LIMIT);
      
      if (data.length === 0) {
        setHasMoreEvents(false);
        return;
      }
      
      if (data.length < EVENTS_LIMIT) setHasMoreEvents(false);
      
      setEvents(prev => [...prev, ...data]);
      setEventsSkip(nextSkip);
      await fetchReactionsForEvents(data, false);
    } catch (err) {
      console.error('Error al cargar más eventos:', err);
    } finally {
      setLoadingMoreEvents(false);
    }
  };

  const handleUploadPhoto = async (eventId) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la galería para subir fotos.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setLoadingEvents(true);
        await uploadImage(eventId, result.assets[0].uri);
        Alert.alert('¡Foto Subida!', 'Tu imagen se ha guardado y publicado en el evento.');
        loadEvents();
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo subir la imagen.');
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
    setLogoutModalVisible(true);
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
      <View style={{ backgroundColor: '#FFFFFF', paddingBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, marginHorizontal: 20, marginTop: 15, marginBottom: 15, paddingHorizontal: 15, height: 46 }}>
           <Search size={20} color="#9CA3AF" />
           <TextInput
              style={{ flex: 1, marginLeft: 10, fontSize: 15, color: '#1F2937' }}
              placeholder="Buscar por nombre o lugar..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
           />
        </View>
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
      // Búsqueda por nombre o ubicación
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        const eventName = (evt.nombre || '').toLowerCase();
        const locationName = (evt.ubicacion?.nombre_lugar || '').toLowerCase();
        if (!eventName.includes(query) && !locationName.includes(query)) {
          return false;
        }
      }
      
      // Filtro por estado
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
          onEndReached={loadMoreEvents}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMoreEvents ? (
              <ActivityIndicator size="small" color="#0F766E" style={{ marginVertical: 16 }} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Info size={40} color="#9CA3AF" />
              <Text style={styles.emptyText}>No hay eventos en este estado en este momento.</Text>
            </View>
          }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.eventCardPremium}
            onPress={() => navigation.navigate('EventDetail', { eventId: item.id_evento, user })}
            activeOpacity={0.9}
          >
            {/* Top Half: Image Background with Overlay */}
            <ImageBackground 
              source={{ uri: item.imagen_url || 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=800' }} 
              style={styles.premiumImageBg}
              imageStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
            >
              <View style={styles.premiumOverlay}>
                <View style={styles.premiumBadgeRow}>
                  <View style={styles.premiumBadgePrimary}>
                    <Text style={styles.premiumBadgeTextPrimary}>{item.estado}</Text>
                  </View>
                  <View style={styles.premiumBadgeSecondary}>
                    <Text style={styles.premiumBadgeTextSecondary}>
                      {weather?.temperatura ? weather.temperatura.toFixed(1) + '°C' : '--°C'}
                    </Text>
                  </View>
                </View>

                <View style={styles.premiumTitleContainer}>
                   <Text style={styles.premiumTitle} numberOfLines={3}>{item.nombre || ''}</Text>
                </View>

                <View style={styles.premiumImageFooter}>
                   <View style={styles.premiumLocationCol}>
                     <MapPin size={12} color="#FFFFFF" style={{ marginRight: 6 }} />
                     <Text style={styles.premiumLocationText}>{item.ubicacion?.nombre_lugar || 'CENTRO HISTÓRICO - PLAZA DE LA INDEPENDENCIA'}</Text>
                   </View>
                   <TouchableOpacity 
                     style={styles.premiumCameraBtn}
                     onPress={() => handleUploadPhoto(item.id_evento)}
                     activeOpacity={0.8}
                   >
                     <Camera size={20} color="#FFFFFF" />
                   </TouchableOpacity>
                </View>
              </View>
            </ImageBackground>

            {/* Bottom Half: Details */}
            <View style={styles.premiumDetails}>
               <View style={styles.premiumDateRow}>
                 <Calendar size={14} color="#6B7280" style={{ marginRight: 6 }} />
                 <Text style={styles.premiumDateText}>{formatDate(item.fecha_hora_inicio)}</Text>
               </View>
               <Text style={styles.premiumDesc} numberOfLines={2}>{item.descripcion}</Text>
               
               {/* Reactions */}
               {(() => {
                  const coverImg = item.imagenes?.find(img => img.id_usuario === item.id_usuario) || (item.imagenes && item.imagenes[0]);
                  if (!coverImg) return null;

                  const imgReactions = eventsReactions[coverImg.id_imagen] || {
                    total_me_gusta: 0,
                    total_no_me_gusta: 0,
                    usuarios_me_gusta: [],
                    usuarios_no_me_gusta: []
                  };

                  const isLiked = (imgReactions.usuarios_me_gusta || []).includes(user?.id_usuario);
                  const isDisliked = (imgReactions.usuarios_no_me_gusta || []).includes(user?.id_usuario);

                  return (
                    <View style={[styles.feedReactionsBar, { borderTopWidth: 0, paddingHorizontal: 0, paddingBottom: 0, paddingTop: 12, backgroundColor: 'transparent' }]}>
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

                <View style={[styles.moreDetailsContainer, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 }]}>
                  <TouchableOpacity 
                     style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}
                     onPress={() => {
                        const lat = item.ubicacion?.latitud;
                        const lon = item.ubicacion?.longitud;
                        let locName = item.ubicacion?.nombre_lugar || 'Loja, Ecuador';
                        
                        // Si no hay coordenadas, añadimos contexto universitario para evitar resultados genéricos en la ciudad
                        if (!lat || !lon) {
                          if (!locName.toLowerCase().includes('loja')) {
                            locName += ' Universidad Nacional de Loja';
                          }
                        }
                        
                        const encodedLoc = encodeURIComponent(locName);
                        let url = '';

                        if (lat && lon) {
                          url = Platform.select({
                            ios: `maps:0,0?ll=${lat},${lon}&q=${encodedLoc}`,
                            android: `geo:${lat},${lon}?q=${lat},${lon}(${encodedLoc})`,
                            web: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
                          });
                        } else {
                          url = Platform.select({
                            ios: `maps:0,0?q=${encodedLoc}`,
                            android: `geo:0,0?q=${encodedLoc}`,
                            web: `https://www.google.com/maps/search/?api=1&query=${encodedLoc}`
                          });
                        }
                        Linking.openURL(url);
                     }}
                  >
                     <Map size={14} color="#059669" style={{ marginRight: 4 }} />
                     <Text style={{ fontSize: 12, color: '#059669', fontWeight: '600' }}>Cómo llegar</Text>
                  </TouchableOpacity>
                  <Text style={styles.moreDetailsText}>Ver más detalles →</Text>
                </View>
            </View>
          </TouchableOpacity>
        )}
      />
      </View>
    );
  };

  const getIconUrl = (icon) => {
    const mapping = {
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

  const renderWeather = () => {
    if (loadingWeather) {
      return <ActivityIndicator size="large" color="#0F766E" style={styles.centerLoader} />;
    }

    if (!weather) {
      return (
        <View style={styles.weatherEmpty}>
          <CloudRain size={40} color="#9CA3AF" />
          <Text style={styles.weatherEmptyText}>Estación fuera de línea temporalmente.</Text>
        </View>
      );
    }

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.weatherContainerNew}>
        {/* Main Card */}
        <LinearGradient colors={["#27436B", "#111B33"]} style={styles.weatherEngineCard}>
          <View style={styles.weatherEngineHeader}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.weatherEngineTitle}>Loja, Ecuador</Text>
                <View style={[styles.sourceBadge, { backgroundColor: weather.fuente === 'ESP32' ? '#059669' : '#0284c7', marginLeft: 8 }]}>
                  <Text style={styles.sourceBadgeText}>{weather.fuente}</Text>
                </View>
              </View>
              <Text style={styles.weatherEngineDate}>
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
              </Text>
            </View>
            <View style={styles.mapIconBtn}>
              <MapPin size={16} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.weatherEngineBody}>
            <View style={styles.weatherEngineTempCol}>
              <Text style={styles.weatherEngineTemp}>
                {weather.temperatura ? weather.temperatura.toFixed(1) : '--'}°C
              </Text>
              <Text style={styles.weatherEngineFeelsLike}>
                {weather.temperatura ? `${weather.temperatura.toFixed(1)}°C / ${(weather.temperatura + 3).toFixed(1)}°C` : '--°C / --°C'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                <CloudRain size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.weatherEngineDesc}>{weather.detalles_alerta.toUpperCase()}</Text>
              </View>
            </View>
            <Image 
              source={{ uri: getIconUrl(weather.icon) }} 
              style={styles.weatherEngineIconBig} 
            />
          </View>
        </LinearGradient>

        {/* Metrics List */}
        <View style={styles.weatherMetricsList}>
          <View style={styles.weatherMetricRow}>
             <View style={styles.weatherMetricLeft}>
               <View style={[styles.weatherMetricIconBox, { backgroundColor: '#EFF6FF' }]}><Thermometer size={16} color="#3B82F6" /></View>
               <Text style={styles.weatherMetricLabel}>SENSACIÓN TÉRMICA</Text>
             </View>
             <Text style={styles.weatherMetricValue}>{weather.feelsLike ? weather.feelsLike.toFixed(1) : '--'}°C</Text>
          </View>
          <View style={styles.weatherMetricRow}>
             <View style={styles.weatherMetricLeft}>
               <View style={[styles.weatherMetricIconBox, { backgroundColor: '#ECFDF5' }]}><CloudRain size={16} color="#10B981" /></View>
               <Text style={styles.weatherMetricLabel}>PROB. DE LLUVIA</Text>
             </View>
             <Text style={styles.weatherMetricValue}>{weather.rainChance !== undefined ? weather.rainChance : '--'}%</Text>
          </View>
          <View style={styles.weatherMetricRow}>
             <View style={styles.weatherMetricLeft}>
               <View style={[styles.weatherMetricIconBox, { backgroundColor: '#F5F3FF' }]}><Wind size={16} color="#8B5CF6" /></View>
               <Text style={styles.weatherMetricLabel}>VELOCIDAD VIENTO</Text>
             </View>
             <Text style={styles.weatherMetricValue}>{weather.windSpeed !== undefined ? weather.windSpeed : '--'} km/h</Text>
          </View>
          <View style={styles.weatherMetricRow}>
             <View style={styles.weatherMetricLeft}>
               <View style={[styles.weatherMetricIconBox, { backgroundColor: '#EFF6FF' }]}><Droplets size={16} color="#3B82F6" /></View>
               <Text style={styles.weatherMetricLabel}>HUMEDAD DEL AIRE</Text>
             </View>
             <Text style={styles.weatherMetricValue}>{weather.humedad !== undefined ? weather.humedad : '--'}%</Text>
          </View>
          <View style={styles.weatherMetricRowBorderNone}>
             <View style={styles.weatherMetricLeft}>
               <View style={[styles.weatherMetricIconBox, { backgroundColor: '#FFFBEB' }]}><Sun size={16} color="#F59E0B" /></View>
               <Text style={styles.weatherMetricLabel}>ÍNDICE UV</Text>
             </View>
             <Text style={styles.weatherMetricValue}>{weather.uvIndex !== undefined ? weather.uvIndex : '--'}</Text>
          </View>
        </View>

        {/* 5-Day Mini Forecast */}
        <View style={styles.forecastGrid}>
          {[0, 1, 2, 3, 4].map((offset) => {
             const d = new Date();
             d.setDate(d.getDate() + offset);
             const day = d.toLocaleDateString('es-ES', { weekday: 'short' }).substring(0, 3).toUpperCase();
             return (
               <View key={offset} style={[styles.forecastCol, offset === 0 && styles.forecastColActive]}>
                 <Text style={[styles.forecastDay, offset === 0 && { color: '#0F766E' }]}>{day}</Text>
                 <CloudRain size={20} color={offset === 0 ? "#FFFFFF" : "#60A5FA"} style={{ marginVertical: 8 }} />
                 <Text style={[styles.forecastTempMax, offset === 0 && { color: '#FFFFFF' }]}>18°</Text>
                 <Text style={[styles.forecastTempMin, offset === 0 && { color: '#9CA3AF' }]}>13°</Text>
               </View>
             );
          })}
        </View>

        {/* Climatology Analytics Chart Mock */}
        <View style={styles.analyticsCard}>
          <View style={styles.analyticsHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
               <TrendingUp size={14} color="#0F766E" />
               <Text style={styles.analyticsTitle}>ANÁLISIS CLIMATOLÓGICO</Text>
            </View>
            <Text style={styles.analyticsStatus}>ESTABLE</Text>
          </View>

          <View style={styles.chartMockup}>
            <View style={styles.barContainer}>
              {[30, 45, 80, 60, 40, 50].map((h, idx) => (
                <View key={idx} style={styles.barWrapper}>
                  <View style={[styles.barFill, { height: `${h}%` }]} />
                </View>
              ))}
            </View>
          </View>

          <View style={styles.chartTimeLabels}>
            {['03:00', '07:00', '11:00', '15:00', '19:00', '23:00'].map(t => (
               <Text key={t} style={styles.chartTimeLabel}>{t}</Text>
            ))}
          </View>

          <View style={styles.chartButtons}>
             <TouchableOpacity style={styles.chartBtnActive}><Text style={styles.chartBtnTextActive}>TEMPERATURA</Text></TouchableOpacity>
             <TouchableOpacity style={styles.chartBtnInactive}><Text style={styles.chartBtnTextInactive}>VIENTO</Text></TouchableOpacity>
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
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
            <View style={styles.roleBadgeContainer}>
              <BadgeCheck size={14} color="#059669" style={{ marginRight: 4 }} />
              <Text style={styles.roleBadge}>Participante Acreditado</Text>
            </View>
          </View>



          {/* Settings / Information Menu */}
          <View style={styles.settingsMenu}>
            <Text style={styles.settingsSectionTitle}>Ajustes y Soporte</Text>
            
            <TouchableOpacity style={styles.settingsItem} activeOpacity={0.7} onPress={() => setNotificationsModalVisible(true)}>
              <View style={styles.settingsItemLeft}>
                <View style={[styles.settingsIconContainer, { backgroundColor: '#E0F2FE' }]}>
                  <Bell size={20} color="#0369A1" />
                </View>
                <View>
                  <Text style={styles.settingsItemText}>Notificaciones</Text>
                  <Text style={styles.settingsItemSubtitle}>Gestiona tus preferencias</Text>
                </View>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingsItem} activeOpacity={0.7} onPress={() => setPrivacyModalVisible(true)}>
              <View style={styles.settingsItemLeft}>
                <View style={[styles.settingsIconContainer, { backgroundColor: '#FEE2E2' }]}>
                  <Shield size={20} color="#B91C1C" />
                </View>
                <View>
                  <Text style={styles.settingsItemText}>Seguridad y Privacidad</Text>
                  <Text style={styles.settingsItemSubtitle}>Protege tu información personal</Text>
                </View>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingsItem} activeOpacity={0.7} onPress={() => setSupportModalVisible(true)}>
              <View style={styles.settingsItemLeft}>
                <View style={[styles.settingsIconContainer, { backgroundColor: '#E6F4F1' }]}>
                  <Info size={20} color="#0F766E" />
                </View>
                <View>
                  <Text style={styles.settingsItemText}>Soporte Técnico</Text>
                  <Text style={styles.settingsItemSubtitle}>Obtén ayuda y soporte</Text>
                </View>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
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

  const renderAlertas = () => {
    return (
      <View style={styles.alertsContainer}>
        <Text style={styles.alertsHeader}>Tus Alertas</Text>
        <ScrollView contentContainerStyle={styles.alertsList}>
          {alerts.length === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 40, padding: 20 }}>
              <Bell size={48} color="#D1D5DB" style={{ marginBottom: 16 }} />
              <Text style={{ fontSize: 16, color: '#6B7280', fontWeight: '500', textAlign: 'center' }}>
                No tienes notificaciones por ahora.
              </Text>
            </View>
          ) : (
            alerts.map((alerta) => {
            const IconComponent = alerta.icon || Bell;
            return (
              <View key={alerta.id} style={[styles.alertCard, alerta.unread && styles.alertCardUnread]}>
                <View style={[styles.alertIconWrapper, { backgroundColor: alerta.color + '1A' }]}>
                  <IconComponent size={24} color={alerta.color} />
                </View>
                <View style={styles.alertContent}>
                  <View style={styles.alertTitleRow}>
                    <Text style={[styles.alertTitle, alerta.unread && styles.alertTitleUnread]}>{alerta.title}</Text>
                    {alerta.unread && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.alertDescription}>{alerta.description}</Text>
                  <Text style={styles.alertTime}>{alerta.time}</Text>
                </View>
              </View>
            );
          })
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeContainer, activeTab === 'profile' && { backgroundColor: '#F8FAFF' }]} edges={['top']}>
      {activeTab === 'profile' && (
        <View style={[StyleSheet.absoluteFillObject, { overflow: 'hidden' }]}>
          <LinearGradient
            colors={["#EEF4FF", "#F8FAFF", "#F3F4F6"]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.topCircleProfile} />
          <View style={styles.bottomCircleProfile} />
        </View>
      )}

      {/* App Header */}
      <View style={styles.header}>
        <View style={{ height: 55, width: 110, marginLeft: -15 }}>
          <Image source={require('../img/logo.png')} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
        </View>
        <TouchableOpacity style={styles.bellBtn} activeOpacity={0.8} onPress={() => setActiveTab('alertas')}>
          <Bell size={22} color="#0F766E" />
          {alerts.length > 0 && <View style={styles.bellDot} />}
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {activeTab === 'feed' && renderFeed()}
        {activeTab === 'weather' && renderWeather()}
        {activeTab === 'profile' && renderProfile()}
        {activeTab === 'alertas' && renderAlertas()}
      </View>

      {/* Custom Bottom Tab Bar */}
      <View style={styles.tabBarWrapper}>
        <View style={styles.tabBar}>
          {[
            { id: 'feed', label: 'INICIO', icon: Calendar },
            { id: 'weather', label: 'CLIMA', icon: Droplets },
            { id: 'alertas', label: 'ALERTAS', icon: Bell },
            { id: 'profile', label: 'PERFIL', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <TouchableOpacity 
                key={tab.id}
                style={styles.tabItem}
                onPress={() => setActiveTab(tab.id)}
              >
                <View>
                  <Icon size={22} color={isActive ? '#059669' : '#6B7280'} />
                  {isActive && <View style={styles.activeTabIndicator} />}
                </View>
                <Text style={[styles.tabLabel, { color: isActive ? '#059669' : '#6B7280', marginTop: 4, fontSize: 9, fontWeight: '800' }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
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

      {/* Notifications Modal */}
      <Modal
        visible={notificationsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setNotificationsModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { justifyContent: 'flex-end', padding: 0 }]}>
          <View style={{ backgroundColor: '#FFFFFF', width: '100%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 }}>
            
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 15 }}>
               <View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center', top: -12 }}>
                 <View style={{ width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2 }} />
               </View>
               <TouchableOpacity onPress={() => setNotificationsModalVisible(false)}>
                 <X size={24} color="#6B7280" />
               </TouchableOpacity>
            </View>
            
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 5 }}>Preferencias de Notificación</Text>
            <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Configura cómo deseas recibir las alertas de tu sistema IoT.</Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }}>
               <View style={{ backgroundColor: '#ECFDF5', padding: 12, borderRadius: 10, marginRight: 15 }}>
                 <Bell size={24} color="#059669" />
               </View>
               <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#1F2937' }}>Notificaciones Push</Text>
                    <View style={{ backgroundColor: pushEnabled ? '#ECFDF5' : '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                       <Text style={{ fontSize: 10, color: pushEnabled ? '#059669' : '#6B7280', fontWeight: '600' }}>{pushEnabled ? 'Activadas' : 'Desactivadas'}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 10, lineHeight: 16 }}>Recibe alertas instantáneas en tu dispositivo sobre eventos y cambios importantes.</Text>
                  <View style={{ alignSelf: 'flex-end' }}>
                     <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ false: '#D1D5DB', true: '#059669' }} thumbColor="#FFFFFF" />
                  </View>
               </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 12, padding: 15, marginBottom: 20, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }}>
               <View style={{ backgroundColor: '#ECFDF5', padding: 12, borderRadius: 10, marginRight: 15 }}>
                 <Mail size={24} color="#059669" />
               </View>
               <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#1F2937' }}>Correos Electrónicos</Text>
                    <View style={{ backgroundColor: emailEnabled ? '#ECFDF5' : '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                       <Text style={{ fontSize: 10, color: emailEnabled ? '#059669' : '#6B7280', fontWeight: '600' }}>{emailEnabled ? 'Activadas' : 'Desactivadas'}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 10, lineHeight: 16 }}>Recibe un resumen de eventos y avisos importantes en tu correo electrónico.</Text>
                  <View style={{ alignSelf: 'flex-end' }}>
                     <Switch value={emailEnabled} onValueChange={setEmailEnabled} trackColor={{ false: '#D1D5DB', true: '#059669' }} thumbColor="#FFFFFF" />
                  </View>
               </View>
            </View>

            <View style={{ flexDirection: 'row', backgroundColor: '#F0FDF4', borderRadius: 12, padding: 15, marginBottom: 20 }}>
               <Info size={20} color="#059669" style={{ marginRight: 10, marginTop: 2 }} />
               <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#059669', marginBottom: 4 }}>Tu privacidad es importante</Text>
                  <Text style={{ fontSize: 12, color: '#059669', lineHeight: 16, opacity: 0.8 }}>Solo te enviaremos notificaciones relevantes y nunca compartiremos tu información.</Text>
               </View>
            </View>

            <TouchableOpacity 
              style={{ backgroundColor: '#059669', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 10 }}
              onPress={() => setNotificationsModalVisible(false)}
            >
              <Save size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Guardar cambios</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      {/* Privacy Modal */}
      <Modal
        visible={privacyModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { justifyContent: 'flex-end', padding: 0 }]}>
          <View style={{ backgroundColor: '#FFFFFF', width: '100%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 }}>
            
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 15 }}>
               <View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center', top: -12 }}>
                 <View style={{ width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2 }} />
               </View>
               <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
                 <X size={24} color="#6B7280" />
               </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
               <View style={{ backgroundColor: '#ECFDF5', padding: 12, borderRadius: 30, marginRight: 15 }}>
                 <ShieldCheck size={28} color="#059669" />
               </View>
               <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>Seguridad y Privacidad</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', lineHeight: 16 }}>Tu cuenta y progreso están protegidos. Solo tú y el administrador tienen acceso a tu información personal.</Text>
               </View>
            </View>

            <View style={{ borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 15, marginBottom: 15, flexDirection: 'row', alignItems: 'center' }}>
               <View style={{ backgroundColor: '#F3F4F6', padding: 10, borderRadius: 12, marginRight: 15 }}>
                 <Lock size={20} color="#059669" />
               </View>
               <View style={{ flex: 1 }}>
                 <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 2 }}>Privacidad garantizada</Text>
                 <Text style={{ fontSize: 12, color: '#6B7280', lineHeight: 16 }}>Tu información personal está cifrada y almacenada de forma segura.</Text>
               </View>
               <ShieldCheck size={20} color="#059669" style={{ marginLeft: 10 }} />
            </View>

            <View style={{ borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 15, marginBottom: 15, flexDirection: 'row', alignItems: 'center' }}>
               <View style={{ backgroundColor: '#F3F4F6', padding: 10, borderRadius: 12, marginRight: 15 }}>
                 <User size={20} color="#059669" />
               </View>
               <View style={{ flex: 1 }}>
                 <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 2 }}>Acceso restringido</Text>
                 <Text style={{ fontSize: 12, color: '#6B7280', lineHeight: 16 }}>Solo tú y el administrador tienen acceso a tu información.</Text>
               </View>
               <UserCog size={20} color="#059669" style={{ marginLeft: 10 }} />
            </View>

            <View style={{ borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 20, marginBottom: 20, flexDirection: 'row', alignItems: 'center' }}>
               <View style={{ backgroundColor: '#F3F4F6', padding: 10, borderRadius: 12, marginRight: 15 }}>
                 <Clock size={20} color="#059669" />
               </View>
               <View style={{ flex: 1 }}>
                 <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 2 }}>Control de actividad</Text>
                 <Text style={{ fontSize: 12, color: '#6B7280', lineHeight: 16 }}>Monitoreamos accesos y cambios para mantener tu cuenta segura.</Text>
               </View>
               <FileText size={20} color="#059669" style={{ marginLeft: 10 }} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 15, marginBottom: 20 }}>
               <Mail size={20} color="#059669" style={{ marginRight: 15 }} />
               <View style={{ flex: 1 }}>
                 <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>Correo encriptado:</Text>
                 <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }}>{user.email}</Text>
               </View>
               <Copy size={20} color="#059669" />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', borderRadius: 12, padding: 15, marginBottom: 20 }}>
               <Lock size={20} color="#059669" style={{ marginRight: 15 }} />
               <View style={{ flex: 1 }}>
                 <Text style={{ fontSize: 13, fontWeight: '600', color: '#059669', marginBottom: 2 }}>Tu seguridad es nuestra prioridad</Text>
                 <Text style={{ fontSize: 12, color: '#6B7280', lineHeight: 16 }}>Trabajamos constantemente para proteger tus datos y tu privacidad.</Text>
               </View>
               <ShieldCheck size={20} color="#059669" style={{ marginLeft: 10 }} />
            </View>
            
            <TouchableOpacity 
              style={{ backgroundColor: '#059669', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 10 }}
              onPress={() => setPrivacyModalVisible(false)}
            >
              <Lock size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Cerrar</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      {/* Support Modal */}
      <Modal
        visible={supportModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSupportModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { justifyContent: 'flex-end', padding: 0 }]}>
          <View style={{ backgroundColor: '#FFFFFF', width: '100%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: Dimensions.get('window').height * 0.9 }}>
            
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 15 }}>
               <View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center', top: -12 }}>
                 <View style={{ width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2 }} />
               </View>
               <TouchableOpacity onPress={() => setSupportModalVisible(false)}>
                 <X size={24} color="#6B7280" />
               </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
               <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                  <View style={{ backgroundColor: '#F0FDF4', padding: 12, borderRadius: 30, marginRight: 15 }}>
                    <Headset size={28} color="#059669" />
                  </View>
                  <View style={{ flex: 1 }}>
                     <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>Soporte Técnico</Text>
                     <Text style={{ fontSize: 12, color: '#6B7280', lineHeight: 16 }}>Estamos aquí para ayudarte. Elige la opción que mejor se adapte a tu necesidad.</Text>
                  </View>
               </View>

               <View style={{ borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 12, marginBottom: 20 }}>
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }} onPress={() => Linking.openURL('mailto:soporte.cloudconnect.unl@gmail.com')}>
                     <View style={{ backgroundColor: '#F0FDF4', padding: 10, borderRadius: 10, marginRight: 15 }}>
                        <Mail size={20} color="#059669" />
                     </View>
                     <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 2 }}>Enviar correo</Text>
                        <Text style={{ fontSize: 12, color: '#6B7280' }}>Cuéntanos tu problema y te responderemos pronto.</Text>
                     </View>
                     <ChevronRight size={20} color="#9CA3AF" />
                  </TouchableOpacity>

                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }} onPress={() => setReportModalVisible(true)}>
                     <View style={{ backgroundColor: '#F0FDF4', padding: 10, borderRadius: 10, marginRight: 15 }}>
                        <FileText size={20} color="#059669" />
                     </View>
                     <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 2 }}>Enviar reporte</Text>
                        <Text style={{ fontSize: 12, color: '#6B7280' }}>Reporta un problema o sugiere una mejora en la aplicación.</Text>
                     </View>
                     <ChevronRight size={20} color="#9CA3AF" />
                  </TouchableOpacity>

                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 15 }} onPress={() => setFaqModalVisible(true)}>
                     <View style={{ backgroundColor: '#F0FDF4', padding: 10, borderRadius: 10, marginRight: 15 }}>
                        <HelpCircle size={20} color="#059669" />
                     </View>
                     <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 2 }}>Preguntas frecuentes</Text>
                        <Text style={{ fontSize: 12, color: '#6B7280' }}>Encuentra respuestas a las dudas más comunes.</Text>
                     </View>
                     <ChevronRight size={20} color="#9CA3AF" />
                  </TouchableOpacity>
               </View>

               <View style={{ backgroundColor: '#F0FDF4', borderRadius: 12, padding: 15, marginBottom: 15, flexDirection: 'row' }}>
                  <ShieldCheck size={20} color="#059669" style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                     <Text style={{ fontSize: 13, fontWeight: '600', color: '#059669', marginBottom: 4 }}>Nuestro compromiso</Text>
                     <Text style={{ fontSize: 12, color: '#6B7280', lineHeight: 16 }}>Tu experiencia es importante para nosotros. Trabajamos para resolver tus inquietudes de manera rápida y eficiente.</Text>
                  </View>
                  <Headset size={40} color="#A7F3D0" style={{ alignSelf: 'flex-end', marginLeft: 10 }} />
               </View>

               <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 15, marginBottom: 20 }}>
                  <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                     <Clock size={20} color="#059669" style={{ marginRight: 10 }} />
                     <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#059669', marginBottom: 2 }}>Horario de atención</Text>
                        <Text style={{ fontSize: 11, color: '#6B7280' }}>Lunes a Viernes: 08:00 - 18:00</Text>
                        <Text style={{ fontSize: 11, color: '#6B7280' }}>Sábados: 09:00 - 13:00</Text>
                     </View>
                  </View>
                  <View style={{ paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
                     <Text style={{ fontSize: 12, fontWeight: '600', color: '#059669', marginBottom: 2 }}>Correo de soporte</Text>
                     <Text style={{ fontSize: 12, color: '#1F2937', fontWeight: '500' }}>soporte.cloudconnect.unl@gmail.com</Text>
                  </View>
               </View>
               
               <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Report Modal */}
      <Modal
        visible={reportModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { justifyContent: 'flex-end', padding: 0 }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
             <View style={{ backgroundColor: '#FFFFFF', width: '100%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 }}>
               
               <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 15 }}>
                  <View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center', top: -12 }}>
                    <View style={{ width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2 }} />
                  </View>
                  <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                    <X size={24} color="#6B7280" />
                  </TouchableOpacity>
               </View>

               <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                  <View style={{ backgroundColor: '#F0FDF4', padding: 12, borderRadius: 30, marginRight: 15 }}>
                    <FileText size={28} color="#059669" />
                  </View>
                  <View style={{ flex: 1 }}>
                     <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>Enviar reporte</Text>
                     <Text style={{ fontSize: 12, color: '#6B7280', lineHeight: 16 }}>Describe detalladamente el problema o sugerencia que encontraste.</Text>
                  </View>
               </View>

               <TextInput
                  style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 12, padding: 15, fontSize: 14, color: '#1F2937', minHeight: 120, textAlignVertical: 'top', marginBottom: 20 }}
                  placeholder="Escribe tu reporte aquí..."
                  placeholderTextColor="#9CA3AF"
                  multiline={true}
               />

               <TouchableOpacity 
                 style={{ backgroundColor: '#059669', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 10 }}
                 onPress={() => {
                   Alert.alert('Reporte enviado', 'Gracias por tu reporte. Nuestro equipo lo revisará pronto.');
                   setReportModalVisible(false);
                 }}
               >
                 <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Enviar</Text>
               </TouchableOpacity>

             </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* FAQ Modal */}
      <Modal
        visible={faqModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFaqModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { justifyContent: 'flex-end', padding: 0 }]}>
          <View style={{ backgroundColor: '#FFFFFF', width: '100%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: Dimensions.get('window').height * 0.9 }}>
            
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 15 }}>
               <View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center', top: -12 }}>
                 <View style={{ width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2 }} />
               </View>
               <TouchableOpacity onPress={() => setFaqModalVisible(false)}>
                 <X size={24} color="#6B7280" />
               </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
               <View style={{ backgroundColor: '#F0FDF4', padding: 12, borderRadius: 30, marginRight: 15 }}>
                 <HelpCircle size={28} color="#059669" />
               </View>
               <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>Preguntas frecuentes</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', lineHeight: 16 }}>Respuestas rápidas a las dudas más comunes del sistema IoT.</Text>
               </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
               <View style={{ marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 4 }}>¿Cómo activo las notificaciones push?</Text>
                  <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 18 }}>Ve al menú Perfil &gt; Preferencias de Notificación y asegúrate de que el interruptor de "Notificaciones Push" esté activado.</Text>
               </View>

               <View style={{ marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 4 }}>¿Qué significan los colores de los eventos?</Text>
                  <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 18 }}>Verde indica estado "Activo", rojo "Finalizado" y naranja "Cancelado" o en "Mantenimiento".</Text>
               </View>

               <View style={{ marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 4 }}>El clima no se actualiza, ¿qué hago?</Text>
                  <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 18 }}>La actualización depende de la conexión del sensor IoT. Revisa la pestaña Alertas para saber si hay cortes de red, o intenta arrastrar la pantalla hacia abajo para refrescar.</Text>
               </View>
               
               <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* Custom Logout Modal */}
      <Modal
        visible={logoutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.logoutModalContainer}>
            <View style={styles.logoutModalIconContainer}>
              <LogOut size={32} color="#EF4444" />
            </View>
            <Text style={styles.logoutModalTitle}>Cerrar Sesión</Text>
            <Text style={styles.logoutModalText}>¿Estás seguro de que quieres salir de tu cuenta?</Text>
            <View style={styles.logoutModalButtons}>
              <TouchableOpacity style={styles.logoutModalBtnCancel} onPress={() => setLogoutModalVisible(false)}>
                <Text style={styles.logoutModalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutModalBtnConfirm} onPress={() => {
                setLogoutModalVisible(false);
                navigation.replace('Login');
              }}>
                <Text style={styles.logoutModalBtnConfirmText}>Salir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  profileScrollContainer: {
    padding: 16,
    paddingBottom: 120,
  },
  profileContainer: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
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
  roleBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleBadge: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '800',
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsItemText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
  },
  settingsItemSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'transparent',
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
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  bellDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  mainContent: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 120,
  },
  alertsContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  alertsHeader: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  alertsList: {
    padding: 16,
    paddingBottom: 100,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  alertCardUnread: {
    backgroundColor: '#F0FDF4',
    borderColor: '#D1FAE5',
  },
  alertIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  alertContent: {
    flex: 1,
  },
  alertTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
  },
  alertTitleUnread: {
    color: '#111827',
    fontWeight: '800',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  alertDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
    lineHeight: 18,
  },
  alertTime: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  weatherContainerNew: {
    padding: 16,
    paddingBottom: 120,
    backgroundColor: '#F9FAFB',
    flexGrow: 1,
  },
  weatherEngineSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 2,
    marginBottom: 16,
    marginLeft: 4,
  },
  weatherEngineCard: {
    backgroundColor: '#1A1C29',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 20,
  },
  weatherEngineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  weatherEngineTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  weatherEngineDate: {
    color: '#9CA3AF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  mapIconBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    borderRadius: 10,
  },
  weatherEngineBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherEngineTempCol: {
    flex: 1,
  },
  weatherEngineTemp: {
    color: '#FFFFFF',
    fontSize: 56,
    fontWeight: '900',
    fontStyle: 'italic',
    lineHeight: 60,
  },
  weatherEngineFeelsLike: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  weatherEngineDesc: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    fontStyle: 'italic',
    marginTop: 2,
  },
  weatherEngineIconBig: {
    width: 100,
    height: 100,
  },
  weatherMetricsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    marginBottom: 20,
  },
  weatherMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginHorizontal: 8,
  },
  weatherMetricRowBorderNone: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 8,
  },
  weatherMetricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherMetricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#111827',
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  weatherMetricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  forecastGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  forecastCol: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  forecastColActive: {
    backgroundColor: '#1A1C29',
  },
  forecastDay: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
  },
  forecastTempMax: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  forecastTempMin: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  analyticsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  analyticsTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4B5563',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  analyticsStatus: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 0.5,
  },
  chartMockup: {
    height: 120,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#0F766E',
    marginBottom: 16,
  },
  chartMockupText: {
    color: '#0F766E',
    fontWeight: 'bold',
    opacity: 0.5,
  },
  barContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    height: 100,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 10,
  },
  barWrapper: {
    width: 14,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#0F766E',
    borderRadius: 8,
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginBottom: 4,
  },
  sourceBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  chartTimeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  chartTimeLabel: {
    fontSize: 8,
    color: '#9CA3AF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  chartButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  chartBtnActive: {
    flex: 1,
    backgroundColor: '#1A1C29',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  chartBtnInactive: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chartBtnTextActive: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  chartBtnTextInactive: {
    color: '#4B5563',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
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
  tabBarWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 24,
    height: 76,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  activeTabIndicator: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#059669',
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
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    fontSize: 11,
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
  eventCardPremium: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  premiumImageBg: {
    width: '100%',
    height: 320,
    justifyContent: 'flex-end',
  },
  premiumOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
    padding: 20,
    justifyContent: 'space-between',
  },
  premiumBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  premiumBadgePrimary: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  premiumBadgeTextPrimary: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  premiumBadgeSecondary: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  premiumBadgeTextSecondary: {
    color: '#111827',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  premiumTitleContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 16,
  },
  premiumTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontFamily: 'AbrilFatface_400Regular',
    lineHeight: 36,
  },
  premiumImageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  premiumLocationCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 12,
  },
  premiumLocationText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    flexWrap: 'wrap',
  },
  premiumCameraBtn: {
    backgroundColor: '#0F766E',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  premiumDetails: {
    padding: 16,
    backgroundColor: '#fff',
  },
  premiumDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  premiumDateText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  premiumDesc: {
    color: '#4B5563',
    fontSize: 13,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoutModalContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  logoutModalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  logoutModalText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  logoutModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  logoutModalBtnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  logoutModalBtnCancelText: {
    color: '#4B5563',
    fontWeight: '600',
    fontSize: 15,
  },
  logoutModalBtnConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutModalBtnConfirmText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  settingsModalCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  settingsModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  settingsModalDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  settingsToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingsToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
    marginRight: 12,
  },
  privacyInfoBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  privacyInfoLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
    marginBottom: 4,
  },
  privacyInfoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '800',
  },
  settingsModalBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  settingsModalBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  topCircleProfile: {
    position: 'absolute',
    top: -150,
    right: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: '#FFFFFF',
    opacity: 0.4,
  },
  bottomCircleProfile: {
    position: 'absolute',
    top: 200,
    left: -150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#EEF4FF',
    opacity: 0.6,
  },
});
