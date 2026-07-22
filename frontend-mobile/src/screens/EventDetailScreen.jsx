// Autor: David Guamán
// Fecha: 27/06/2026
// Version: 0.3
// Historial:
// 27/06/2026 v0.1 - David Guamán: Creación de la pantalla de detalles del evento con foto de portada diferenciada y con barra de reacciones, límite estricto de 3 fotos de evidencia por participante, captura de fotos exclusiva por cámara (sin editor de recorte para subir en resolución completa original), lista modal interactiva de reacciones, visor de clima del campus y unificación de imágenes de portada y evidencias al formato fotográfico 4:3 (250px).
// 07/07/2026 v0.2 - Isabel Morocho: Se agrega opción de reportar imágenes de participantes (movido desde la web, exclusivo para app móvil).
// 08/07/2026 v0.3 - Isabel Morocho: Se agrega opción de eliminar las fotos propias del participante (no la imagen de portada del evento).

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  FlatList,
  Modal,
  TextInput
} from 'react-native';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Camera,
  Image as ImageIcon,
  ThumbsUp,
  ThumbsDown,
  Clock,
  User,
  Info,
  X,
  Sun,
  CloudRain,
  Flag,
  Trash2
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import api, { uploadImage, reaccionarAImagen, obtenerReaccionesImagen, getClimaActual, reportarImagen, eliminarImagen } from '../services/api';

export default function EventDetailScreen({ route, navigation }) {
  const { eventId, user } = route.params;

  const [event, setEvent] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [reactions, setReactions] = useState({});
  const [uploading, setUploading] = useState(false);
  const [showReactionsModal, setShowReactionsModal] = useState(false);
  const [selectedImageReactions, setSelectedImageReactions] = useState(null);
  const [userNames, setUserNames] = useState({});
  const [weather, setWeather] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  // --- Estado para reportar imágenes ---
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTargetId, setReportTargetId] = useState(null);
  const [reportMotivo, setReportMotivo] = useState('');
  const [reportando, setReportando] = useState(false);

  const openReactionsList = (imgReactions) => {
    setSelectedImageReactions(imgReactions);
    setShowReactionsModal(true);
  };

  const openReportModal = (idImagen) => {
    const imgObj = event?.imagenes?.find(i => i.id_imagen === idImagen);
    if (imgObj && imgObj.reportada) {
      Alert.alert(
        'Imagen Ya Reportada',
        'Esta imagen ya ha sido reportada anteriormente y se encuentra en proceso de revisión por el equipo de moderación.',
        [{ text: 'Entendido' }]
      );
      return;
    }
    setReportTargetId(idImagen);
    setReportMotivo('');
    setShowReportModal(true);
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setReportTargetId(null);
    setReportMotivo('');
  };

  const handleReportar = async () => {
    if (!reportMotivo.trim()) {
      Alert.alert('Falta el motivo', 'Por favor escribe un motivo para el reporte.');
      return;
    }
    setReportando(true);
    try {
      await reportarImagen(reportTargetId, reportMotivo.trim());
      // Marcar la imagen como reportada en el estado local para bloquear reportes duplicados
      if (event && event.imagenes) {
        setEvent({
          ...event,
          imagenes: event.imagenes.map(img => 
            img.id_imagen === reportTargetId ? { ...img, reportada: true } : img
          )
        });
      }
      Alert.alert('Reporte enviado', 'Gracias por tu colaboración. Un administrador revisará la imagen.');
      closeReportModal();
    } catch (err) {
      console.error('Error al reportar imagen:', err);
      const msg = err.response?.data?.detail || 'No se pudo enviar el reporte.';
      Alert.alert('Imagen Ya Reportada', typeof msg === 'string' ? msg : 'Esta imagen ya ha sido reportada previamente.');
    } finally {
      setReportando(false);
    }
  };

  // const handleEliminarImagen = (idImagen) => {
  //   Alert.alert(
  //     'Eliminar imagen',
  //     '¿Estás seguro de eliminar esta foto? Esta acción no se puede deshacer.',
  //     [
  //       { text: 'Cancelar', style: 'cancel' },
  //       {
  //         text: 'Eliminar',
  //         style: 'destructive',
  //         onPress: async () => {
  //           try {
  //             await eliminarImagen(idImagen);
  //             Alert.alert('Listo', 'Imagen eliminada correctamente.');
  //             fetchEventDetails();
  //           } catch (err) {
  //             console.error('Error al eliminar imagen:', err);
  //             const msg = err.response?.data?.detail || 'No se pudo eliminar la imagen.';
  //             Alert.alert('Error', msg);
  //           }
  //         }
  //       }
  //     ]
  //   );
  // };

  const confirmarAccion = (titulo, mensaje) => {
    return new Promise((resolve) => {
      if (Platform.OS === 'web') {
        const ok = window.confirm(`${titulo}\n\n${mensaje}`);
        resolve(ok);
      } else {
        Alert.alert(titulo, mensaje, [
          { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) },
        ]);
      }
    });
  };

  const handleEliminarImagen = async (idImagen) => {
    console.log('handleEliminarImagen llamado con:', idImagen);

    const confirmado = await confirmarAccion(
      'Eliminar imagen',
      '¿Estás seguro de eliminar esta foto? Esta acción no se puede deshacer.'
    );

    if (!confirmado) return;

    try {
      const resultado = await eliminarImagen(idImagen);
      console.log('Eliminado OK:', resultado);
      Alert.alert('Listo', 'Imagen eliminada correctamente.');
      fetchEventDetails();
    } catch (err) {
      console.log('ERROR STATUS:', err.response?.status);
      console.log('ERROR DATA:', err.response?.data);
      console.log('ERROR MESSAGE:', err.message);
      const msg = err.response?.data?.detail || 'No se pudo eliminar la imagen.';
      Alert.alert('Error', msg);
    }
  };






  const resolveUserName = async (idUsuario) => {
    if (userNames[idUsuario]) return;

    if (idUsuario === user.id_usuario) {
      setUserNames(prev => ({
        ...prev,
        [idUsuario]: `${user.nombre || user.name || 'Tú'}`
      }));
      return;
    }

    try {
      const res = await api.get(`/usuarios/${idUsuario}/perfil-basico`);
      if (res.data) {
        setUserNames(prev => ({
          ...prev,
          [idUsuario]: `${res.data.nombre} ${res.data.apellido}`
        }));
      }
    } catch (err) {
      console.warn(`Could not fetch profile for user ${idUsuario}:`, err.message);
      setUserNames(prev => ({
        ...prev,
        [idUsuario]: `Participante #${idUsuario}`
      }));
    }
  };

  const renderReactionsModal = () => {
    if (!selectedImageReactions) return null;

    const likes = selectedImageReactions.usuarios_me_gusta || [];
    const dislikes = selectedImageReactions.usuarios_no_me_gusta || [];
    const hasReactions = likes.length > 0 || dislikes.length > 0;

    return (
      <Modal
        visible={showReactionsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowReactionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reacciones a la imagen</Text>
              <TouchableOpacity onPress={() => setShowReactionsModal(false)} style={styles.closeModalBtn}>
                <X size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            {hasReactions ? (
              <ScrollView style={styles.modalBody}>
                {likes.length > 0 && (
                  <View style={styles.reactionGroup}>
                    <Text style={styles.reactionGroupTitle}>👍 Me gusta ({likes.length})</Text>
                    {likes.map((userId) => (
                      <View key={`like-${userId}`} style={styles.reactionUserRow}>
                        <View style={styles.userIconWrapper}>
                          <User size={14} color="#0F766E" />
                        </View>
                        <Text style={styles.reactionUserName}>
                          {userNames[userId] || 'Cargando...'} {userId === user.id_usuario ? '(Tú)' : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {dislikes.length > 0 && (
                  <View style={styles.reactionGroup}>
                    <Text style={styles.reactionGroupTitle}>👎 No me gusta ({dislikes.length})</Text>
                    {dislikes.map((userId) => (
                      <View key={`dislike-${userId}`} style={styles.reactionUserRow}>
                        <View style={styles.userIconWrapper}>
                          <User size={14} color="#EF4444" />
                        </View>
                        <Text style={styles.reactionUserName}>
                          {userNames[userId] || 'Cargando...'} {userId === user.id_usuario ? '(Tú)' : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            ) : (
              <View style={styles.emptyReactionsModal}>
                <Info size={32} color="#9CA3AF" />
                <Text style={styles.emptyReactionsModalText}>Aún no hay reacciones en esta imagen.</Text>
              </View>
            )}

            {/* Modal Footer */}
            <TouchableOpacity
              style={styles.closeButtonModal}
              onPress={() => setShowReactionsModal(false)}
            >
              <Text style={styles.closeButtonModalText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderReportModal = () => {
    return (
      <Modal
        visible={showReportModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeReportModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🚩 Reportar imagen</Text>
              <TouchableOpacity onPress={closeReportModal} style={styles.closeModalBtn}>
                <X size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <Text style={styles.reportHelperText}>
              ¿Por qué consideras que esta imagen debería ser revisada?
            </Text>
            <TextInput
              style={styles.reportTextInput}
              placeholder="Ej: contenido inapropiado, no pertenece al evento..."
              placeholderTextColor="#9CA3AF"
              value={reportMotivo}
              onChangeText={(text) => setReportMotivo(text.slice(0, 500))}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.reportCharCount}>{reportMotivo.length}/500</Text>

            {/* Modal Footer */}
            <TouchableOpacity
              style={[styles.closeButtonModal, styles.reportSubmitBtn]}
              onPress={handleReportar}
              disabled={reportando}
            >
              <Text style={styles.closeButtonModalText}>
                {reportando ? 'Enviando...' : 'Reportar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoadingEvent(true);
      const res = await api.get(`/eventos/${eventId}`);
      setEvent(res.data);

      const userIdsToResolve = new Set();
      if (res.data.imagenes) {
        res.data.imagenes.forEach(img => userIdsToResolve.add(img.id_usuario));
      }

      // Fetch reactions for all images in parallel
      if (res.data.imagenes && res.data.imagenes.length > 0) {
        const reactionsData = {};
        await Promise.all(
          res.data.imagenes.map(async (img) => {
            try {
              const reactionsRes = await obtenerReaccionesImagen(img.id_imagen);
              reactionsData[img.id_imagen] = reactionsRes;

              if (reactionsRes.usuarios_me_gusta) {
                reactionsRes.usuarios_me_gusta.forEach(uid => userIdsToResolve.add(uid));
              }
              if (reactionsRes.usuarios_no_me_gusta) {
                reactionsRes.usuarios_no_me_gusta.forEach(uid => userIdsToResolve.add(uid));
              }
            } catch (err) {
              console.error(`Error fetching reactions for image ${img.id_imagen}:`, err);
              reactionsData[img.id_imagen] = {
                total_me_gusta: 0,
                total_no_me_gusta: 0,
                usuarios_me_gusta: [],
                usuarios_no_me_gusta: []
              };
            }
          })
        );
        setReactions(reactionsData);
      }

      // Resolve usernames asynchronously in parallel
      userIdsToResolve.forEach(uid => {
        resolveUserName(uid);
      });

      // Fetch climate/weather in background with fallback
      try {
        const climateData = await getClimaActual();
        setWeather(climateData);
      } catch (err) {
        console.warn('Could not load weather for event detail:', err.message);
      }

    } catch (err) {
      console.error('Error fetching event details:', err);
      Alert.alert('Error', 'No se pudieron cargar los detalles del evento.');
    } finally {
      setLoadingEvent(false);
    }
  };

  const handleReaction = async (idImagen, tipo) => {
    try {
      // Optimistic UI update
      const currentReactions = reactions[idImagen] || {
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
          // Remove like
          updatedMeGusta = updatedMeGusta.filter(id => id !== userId);
        } else {
          // Add like and remove dislike if exists
          updatedMeGusta.push(userId);
          updatedNoMeGusta = updatedNoMeGusta.filter(id => id !== userId);
        }
      } else if (tipo === 'NO_ME_GUSTA') {
        if (alreadyDisliked) {
          // Remove dislike
          updatedNoMeGusta = updatedNoMeGusta.filter(id => id !== userId);
        } else {
          // Add dislike and remove like if exists
          updatedNoMeGusta.push(userId);
          updatedMeGusta = updatedMeGusta.filter(id => id !== userId);
        }
      }

      const tempReactions = {
        ...reactions,
        [idImagen]: {
          total_me_gusta: updatedMeGusta.length,
          total_no_me_gusta: updatedNoMeGusta.length,
          usuarios_me_gusta: updatedMeGusta,
          usuarios_no_me_gusta: updatedNoMeGusta
        }
      };
      setReactions(tempReactions);

      // Call API
      await reaccionarAImagen(idImagen, tipo);

      // Refetch actual reactions for accuracy
      const freshReactions = await obtenerReaccionesImagen(idImagen);
      setReactions(prev => ({
        ...prev,
        [idImagen]: freshReactions
      }));
    } catch (err) {
      console.error('Error reacting to image:', err);
      // Revert/refetch in case of failure
      fetchEventDetails();
    }
  };

  const selectImageAndUpload = async (useCamera) => {
    // Check if the current participant has already uploaded 3 images for this event
    const uploadedCount = event?.imagenes?.filter(img => img.id_usuario === user.id_usuario).length || 0;
    if (uploadedCount >= 3) {
      Alert.alert(
        'Límite alcanzado',
        'Has alcanzado el límite de 3 imágenes permitidas para subir como evidencia en este evento.'
      );
      return;
    }

    let permissionResult;
    if (useCamera) {
      permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    } else {
      permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }

    if (permissionResult.status !== 'granted') {
      Alert.alert(
        'Permiso denegado',
        `Necesitamos acceso a la ${useCamera ? 'cámara' : 'galería'} para tomar la evidencia.`
      );
      return;
    }

    let result;
    const remainingCount = 3 - uploadedCount;
    if (useCamera) {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.3,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.3,
        allowsMultipleSelection: false,
      });
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uris = result.assets.slice(0, remainingCount).map(a => a.uri);
      uploadEvidence(uris);
    }
  };

  const uploadEvidence = async (uris) => {
    try {
      setUploading(true);
      for (const uri of uris) {
        await uploadImage(eventId, uri);
      }
      Alert.alert('Éxito', '¡Evidencia visual agregada y publicada con éxito!');
      fetchEventDetails(); // Reload event details and images
    } catch (err) {
      console.error('Error uploading image:', err);
      const msg = err.response?.data?.detail || 'No se pudo subir la imagen al servidor.';
      Alert.alert('Error de subida', msg);
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
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

  if (loadingEvent) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0F766E" />
        <Text style={styles.loadingText}>Cargando detalles del evento...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centerContainer}>
        <Info size={40} color="#EF4444" />
        <Text style={styles.errorText}>No se pudo encontrar el evento especificado.</Text>
        <TouchableOpacity style={styles.backBtnError} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnErrorText}>Regresar al Feed</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderHeader = () => {
    // Find the cover image uploaded by the event creator
    const coverImage = event.imagenes?.find(img => img.id_usuario === event.id_usuario);
    // Count participant publications (excluding the specific cover image)
    const participantImagesCount = event.imagenes?.filter(img => img.id_imagen !== coverImage?.id_imagen).length || 0;

    let coverReactionsBar = null;
    if (coverImage) {
      const imgReactions = reactions[coverImage.id_imagen] || {
        total_me_gusta: 0,
        total_no_me_gusta: 0,
        usuarios_me_gusta: [],
        usuarios_no_me_gusta: []
      };

      const isLiked = imgReactions.usuarios_me_gusta.includes(user.id_usuario);
      const isDisliked = imgReactions.usuarios_no_me_gusta.includes(user.id_usuario);

      coverReactionsBar = (
        <View style={styles.coverReactionsBar}>
          <TouchableOpacity
            style={[styles.reactionBtn, isLiked && styles.reactionBtnActiveLike]}
            onPress={() => handleReaction(coverImage.id_imagen, 'ME_GUSTA')}
          >
            <ThumbsUp size={16} color={isLiked ? '#fff' : '#6B7280'} />
            <Text style={[styles.reactionCount, isLiked && styles.reactionTextActive]}>
              {imgReactions.total_me_gusta}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.reactionBtn, isDisliked && styles.reactionBtnActiveDislike]}
            onPress={() => handleReaction(coverImage.id_imagen, 'NO_ME_GUSTA')}
          >
            <ThumbsDown size={16} color={isDisliked ? '#fff' : '#6B7280'} />
            <Text style={[styles.reactionCount, isDisliked && styles.reactionTextActive]}>
              {imgReactions.total_no_me_gusta}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewReactionsBtn}
            onPress={() => openReactionsList(imgReactions)}
          >
            <Info size={14} color="#0F766E" />
            <Text style={styles.viewReactionsText}>¿Quién reaccionó?</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.eventInfoSection}>
        {coverImage && (
          <View style={styles.coverImageContainer}>
            <TouchableOpacity
              onPress={() => setFullscreenImage(coverImage.url_minio)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: coverImage.url_minio }}
                style={styles.coverImage}
              />
            </TouchableOpacity>
            {coverReactionsBar}
          </View>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          <Text style={styles.eventTitle}>{event.nombre}</Text>
          {renderStatusBadge(event.estado)}
        </View>

        <View style={styles.metaRow}>
          <Calendar size={14} color="#0F766E" />
          <Text style={styles.metaText}>{formatDate(event.fecha_hora_inicio)} - {formatDate(event.fecha_hora_final)}</Text>
        </View>

        <View style={styles.metaRow}>
          <MapPin size={14} color="#0F766E" />
          <Text style={styles.metaText}>{event.ubicacion?.nombre_lugar || 'Campus Central'}</Text>
        </View>

        {weather && (
          <View style={styles.metaRow}>
            {weather.temperatura > 22 ? <Sun size={14} color="#D97706" /> : <CloudRain size={14} color="#0F766E" />}
            <Text style={styles.metaText}>Condición Climática: {weather.temperatura}°C (Humedad: {weather.humedad}%)</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Descripción</Text>
        <Text style={styles.eventDesc}>{event.descripcion}</Text>

        {/* Floating Upload Options */}
        <Text style={styles.sectionTitle}>Aportar Evidencia Visual</Text>
        {uploading ? (
          <View style={styles.uploadLoaderContainer}>
            <ActivityIndicator size="small" color="#0F766E" />
            <Text style={styles.uploadingText}>Subiendo foto a MinIO...</Text>
          </View>
        ) : (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.cameraBtn} onPress={() => selectImageAndUpload(true)}>
              <Camera size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Cámara</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.galleryBtn} onPress={() => selectImageAndUpload(false)}>
              <ImageIcon size={18} color="#0F766E" />
              <Text style={styles.galleryBtnText}>Galería</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>Publicaciones de Participantes ({participantImagesCount})</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header Navigation */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Detalle del Evento</Text>
      </View>

      <FlatList
        data={event.imagenes?.filter(img => {
          const coverImage = event.imagenes?.find(i => i.id_usuario === event.id_usuario);
          return img.id_imagen !== coverImage?.id_imagen;
        }) || []}
        keyExtractor={(item) => String(item.id_imagen)}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyPhotosContainer}>
            <ImageIcon size={36} color="#9CA3AF" />
            <Text style={styles.emptyPhotosText}>Ningún participante ha subido fotos todavía.</Text>
            <Text style={styles.emptyPhotosSubtext}>¡Sé el primero en documentar este evento!</Text>
          </View>
        }
        renderItem={({ item }) => {
          const imgReactions = reactions[item.id_imagen] || {
            total_me_gusta: 0,
            total_no_me_gusta: 0,
            usuarios_me_gusta: [],
            usuarios_no_me_gusta: []
          };

          const isLiked = imgReactions.usuarios_me_gusta.includes(user.id_usuario);
          const isDisliked = imgReactions.usuarios_no_me_gusta.includes(user.id_usuario);
          const esPropia = item.id_usuario === user.id_usuario;

          return (
            <View style={styles.pubCard}>
              <View style={styles.pubHeader}>
                <View style={styles.userAvatar}>
                  <User size={16} color="#0F766E" />
                </View>
                <View>
                  <Text style={styles.pubUserName}>{userNames[item.id_usuario] || 'Cargando...'}</Text>
                  <Text style={styles.pubTime}>
                    <Clock size={10} color="#9CA3AF" /> {formatDate(item.fecha_subida)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setFullscreenImage(item.url_minio)}
                activeOpacity={0.9}
              >
                <Image source={{ uri: item.url_minio }} style={styles.pubImage} />
              </TouchableOpacity>

              <View style={styles.reactionsBar}>
                <TouchableOpacity
                  style={[styles.reactionBtn, isLiked && styles.reactionBtnActiveLike]}
                  onPress={() => handleReaction(item.id_imagen, 'ME_GUSTA')}
                >
                  <ThumbsUp size={16} color={isLiked ? '#fff' : '#6B7280'} />
                  <Text style={[styles.reactionCount, isLiked && styles.reactionTextActive]}>
                    {imgReactions.total_me_gusta}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.reactionBtn, isDisliked && styles.reactionBtnActiveDislike]}
                  onPress={() => handleReaction(item.id_imagen, 'NO_ME_GUSTA')}
                >
                  <ThumbsDown size={16} color={isDisliked ? '#fff' : '#6B7280'} />
                  <Text style={[styles.reactionCount, isDisliked && styles.reactionTextActive]}>
                    {imgReactions.total_no_me_gusta}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.viewReactionsBtn}
                  onPress={() => openReactionsList(imgReactions)}
                >
                  <Info size={14} color="#0F766E" />
                  <Text style={styles.viewReactionsText}>¿Quién reaccionó?</Text>
                </TouchableOpacity>

                {esPropia ? (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleEliminarImagen(item.id_imagen)}
                  >
                    <Trash2 size={14} color="#EF4444" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.reportBtn}
                    onPress={() => openReportModal(item.id_imagen)}
                  >
                    <Flag size={14} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />
      {renderReactionsModal()}
      {renderReportModal()}

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  listContainer: {
    paddingBottom: 30,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#6B7280',
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  backBtnError: {
    backgroundColor: '#0F766E',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backBtnErrorText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  eventInfoSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#4B5563',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 8,
  },
  eventDesc: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  cameraBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0F766E',
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  galleryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E6F4F1',
    paddingVertical: 10,
    borderRadius: 8,
  },
  galleryBtnText: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '700',
  },
  uploadLoaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  uploadingText: {
    fontSize: 11,
    color: '#4B5563',
  },
  emptyPhotosContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyPhotosText: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyPhotosSubtext: {
    marginTop: 4,
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  pubCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  pubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pubUserName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  pubTime: {
    fontSize: 10,
    color: '#9CA3AF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  pubImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    resizeMode: 'cover',
  },
  reactionsBar: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FAFAFA',
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reactionBtnActiveLike: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  reactionBtnActiveDislike: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  reactionCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  reactionTextActive: {
    color: '#fff',
  },
  reportBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginLeft: 'auto',
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginLeft: 'auto',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '70%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 12,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F766E',
  },
  closeModalBtn: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 16,
  },
  reactionGroup: {
    marginBottom: 16,
  },
  reactionGroupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  reactionUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 8,
  },
  userIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionUserName: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
  },
  emptyReactionsModal: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyReactionsModalText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  closeButtonModal: {
    backgroundColor: '#0F766E',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonModalText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  viewReactionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  viewReactionsText: {
    fontSize: 11,
    color: '#0F766E',
    fontWeight: '700',
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
    resizeMode: 'contain',
  },
  coverImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    marginBottom: 8,
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  coverImageContainer: {
    marginBottom: 16,
  },
  coverReactionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 4,
  },
  reportHelperText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10,
    lineHeight: 17,
  },
  reportTextInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#1F2937',
    textAlignVertical: 'top',
    minHeight: 90,
  },
  reportCharCount: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 12,
  },
  reportSubmitBtn: {
    backgroundColor: '#EF4444',
  },
});