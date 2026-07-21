// Autor: David Guamán
// Fecha: 07/07/2026
// Version: 0.3
// Historial:
// 27/06/2026 v0.1 - David Guamán: Implementación de la pantalla de inicio de sesión con soporte para autenticación estándar y botón integrado con el logo vectorial oficial de Google.
// 07/07/2026 v0.2 - Implementación de captura y registro de Expo Push Token en los flujos de login.
// 08/07/2026 v0.3 - Isabel: Fix - registro de push token envuelto en try/catch propio para que un fallo ahí (Expo Go / Web) no rompa el login exitoso.

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput, Image, Platform } from 'react-native';
import { Eye, EyeOff, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import * as Notifications from 'expo-notifications';
import Input from '../components/Input';
import Button from '../components/Button';
import BackgroundLayout from '../components/BackgroundLayout';
import api, { login, loginGoogle, setAuthHeaders } from '../services/api';
import Recaptcha from 'react-native-recaptcha-that-works';
import { useRef } from 'react';

const GoogleIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: 10 }}>
    <Path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <Path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <Path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <Path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </Svg>
);

// Fail-safe dynamic loading of the native Google Sign-in module.
// If running in Expo Go (where native modules are not linked), this catches the error
// and falls back gracefully to a simulation mode so the app doesn't crash.
let GoogleSignin = null;
let statusCodes = {};
try {
  const GoogleModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = GoogleModule.GoogleSignin;
  statusCodes = GoogleModule.statusCodes;
} catch (error) {
  console.warn("Google Sign-In native module not found or not linked. Running Google Auth in simulation mode.");
}

async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.warn('Failed to get push token for push notification!');
    return null;
  }
  
  // Use projectId from app.json or hardcoded to ensure it works in Expo Go and standalone
  token = (await Notifications.getExpoPushTokenAsync({
    projectId: '39cba17d-a5da-4180-b30e-58603aa24474',
  })).data;
  
  return token;
}

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

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const recaptcha = useRef();



  useEffect(() => {
    if (GoogleSignin) {
      try {
        GoogleSignin.configure({
          webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
          offlineAccess: true,
        });
      } catch (err) {
        console.error("Error configuring Google Sign-in:", err);
      }
    }
  }, []);

  const submit = () => {
    if (!username.trim() || !password.trim()) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    setError('');
    // Al dar click en iniciar sesión, primero abrimos el reCAPTCHA
    if (recaptcha.current) {
      recaptcha.current.open();
    }
  };

  const onRecaptchaVerify = async (token) => {
    setLoading(true);

    try {
      const res = await login({ username: username.trim(), password, recaptcha_token: token });
      setLoading(false);

      if (res.id_rol !== 2) {
        setError('Acceso denegado: La aplicación móvil es solo para estudiantes (participantes). Los administradores deben usar la plataforma web.');
        return;
      }

      const userProfile = {
        id_usuario: res.id_usuario,
        id_rol: res.id_rol,
        name: `${res.nombre} ${res.apellido}`,
        email: res.correo || username,
        token: res.access_token,
      };

      // Configurar el token en la instancia de Axios antes de usarla para llamadas protegidas
      setAuthHeaders(res.id_usuario, res.id_rol, res.access_token);

      // Obtener token push al iniciar sesión.
      // Envuelto en su propio try/catch: si falla (normal en Expo Go o Web,
      // donde las notificaciones push remotas no están soportadas desde SDK 51),
      // NO debe bloquear ni cancelar el login que ya fue exitoso.
      try {
        const pushToken = await registerForPushNotificationsAsync();
        console.log("🔔 Push token obtenido:", pushToken);
        console.log("🔑 JWT token:", res.access_token ? res.access_token.substring(0, 30) + '...' : 'UNDEFINED');
        console.log("📡 Auth header actual:", api.defaults.headers.common['Authorization'] ? 'SET' : 'NOT SET');
        if (pushToken) {
          // Enviar token al nuevo microservicio de notificaciones
          const saveRes = await api.post('/notificaciones/guardar-token', {
            id_usuario: res.id_usuario,
            expo_push_token: pushToken
          });
          console.log("✅ Token guardado en el backend:", pushToken, saveRes.data);
        }
      } catch (pushError) {
        console.warn('❌ No se pudo registrar el push token:', pushError.message);
        if (pushError.response) {
          console.warn('❌ Status:', pushError.response.status, 'Data:', JSON.stringify(pushError.response.data));
        }
      }

      navigation.replace('Participant', { user: userProfile });
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.detail || 'Error de conexión. Intente más tarde.';
      setError(msg);
      Alert.alert('Error de Autenticación', msg);
    }
  };

  const signInWithGoogle = async () => {
    setError('');
    setLoading(true);


    // --- NATIVE GOOGLE SIGN-IN MODE (For Android Emulator / Physical Device with Dev Client) ---
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.idToken;

      if (!idToken) {
        throw new Error('No se obtuvo el idToken de Google.');
      }

      const res = await loginGoogle({ google_token: idToken });
      setLoading(false);

      if (res.id_rol !== 2) {
        setError('Acceso denegado: La aplicación móvil es solo para estudiantes (participantes). Los administradores deben usar la plataforma web.');
        return;
      }

      const userProfile = {
        id_usuario: res.id_usuario,
        id_rol: res.id_rol,
        name: `${res.nombre} ${res.apellido}`,
        email: res.correo,
        token: res.access_token,
      };

      // Configurar el token en la instancia de Axios
      setAuthHeaders(res.id_usuario, res.id_rol, res.access_token);

      // Obtener token push al iniciar sesión con Google.
      // Envuelto en su propio try/catch por la misma razón que en submit().
      try {
        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken) {
          // Enviar token al nuevo microservicio de notificaciones
          await api.post('/notificaciones/guardar-token', {
            id_usuario: res.usuario.id_usuario,
            expo_push_token: pushToken
          });
          console.log("Token guardado en el backend (Google):", pushToken);
        }
      } catch (pushError) {
        console.warn('No se pudo registrar el push token (normal en Expo Go/Web):', pushError.message);
      }

      Alert.alert('¡Bienvenido!', `Hola, ${userProfile.name}`, [
        { text: 'Entrar', onPress: () => navigation.replace('Participant', { user: userProfile }) }
      ]);
    } catch (err) {
      setLoading(false);
      let msg = 'Error al iniciar sesión con Google.';
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        msg = 'Inicio de sesión cancelado.';
      } else if (err.code === statusCodes.IN_PROGRESS) {
        msg = 'Inicio de sesión en progreso.';
      } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        msg = 'Servicios de Google Play no disponibles.';
      } else {
        msg = err.response?.data?.detail || err.message || msg;
      }
      setError(msg);
      Alert.alert('Error de Google Auth', msg);
    }
  };

  return (
    <BackgroundLayout>
      <View style={styles.container}>
        <View style={styles.header}>
        <View style={{ height: 90, width: 180, marginBottom: 12 }}>
          <Image source={require('../img/logo.png')} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
        </View>
        <Text style={styles.title}>¡Bienvenido!</Text>
        <Text style={styles.subtitle}>Accede con tu correo institucional</Text>
      </View>

      <View style={styles.card}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <View style={styles.iconCircle}>
              <Mail size={16} color="#059669" />
            </View>
            <Text style={styles.label}>Correo institucional</Text>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.inputText}
              value={username}
              onChangeText={setUsername}
              placeholder="usuario.apellido@unl.edu.ec"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <View style={styles.iconCircle}>
              <Lock size={16} color="#059669" />
            </View>
            <Text style={styles.label}>Contraseña</Text>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.inputText}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.passwordToggle}
            >
              {showPassword ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
            </TouchableOpacity>
          </View>
        </View>

        <Recaptcha
          ref={recaptcha}
          siteKey={process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY}
          baseUrl="https://unl-cloud-connect.me"
          onVerify={onRecaptchaVerify}
          onExpire={() => setError('El captcha expiró. Inténtalo de nuevo.')}
          onError={() => setError('Error al cargar el captcha.')}
          size="normal"
        />

        <TouchableOpacity onPress={() => navigation.navigate('Recover')} style={styles.forgotButton}>
          <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#0F766E" style={styles.loader} />
        ) : (
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.primaryButton} onPress={submit}>
              <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
              <ArrowRight size={20} color="#fff" style={{ position: 'absolute', right: 20 }} />
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              onPress={signInWithGoogle}
              style={styles.googleButton}
            >
              <GoogleIcon />
              <Text style={styles.googleButtonText}>Iniciar sesión con Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              style={styles.registerLink}
            >
              <Text style={styles.registerLinkText}>¿No tienes cuenta? <Text style={styles.registerLinkTextBlue}>Regístrate aquí</Text></Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      <View style={styles.footerContainer}>
        <ShieldCheck size={16} color="#059669" />
        <Text style={styles.footerText}>Tu información está segura con nosotros.</Text>
      </View>
      </View>
    </BackgroundLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: 'transparent',
    justifyContent: 'center',
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 15,
  },
  card: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderColor: '#E2E8F0',
    borderWidth: 1,
  },
  inputText: {
    flex: 1,
    padding: 14,
    color: '#1E293B',
    fontSize: 15,
  },
  passwordToggle: {
    padding: 12,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    color: '#0F766E',
    fontSize: 13,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 12,
  },
  buttonContainer: {
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#0F766E',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    paddingHorizontal: 12,
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
  googleButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  googleButtonText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 15,
  },
  registerLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  registerLinkText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  registerLinkTextBlue: {
    color: '#0F766E',
    fontWeight: '600',
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    color: '#64748B',
    fontSize: 13,
    marginLeft: 6,
  }
});