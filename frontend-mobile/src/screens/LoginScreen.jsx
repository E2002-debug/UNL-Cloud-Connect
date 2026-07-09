// Autor: David Guamán
// Fecha: 07/07/2026
// Version: 0.3
// Historial:
// 27/06/2026 v0.1 - David Guamán: Implementación de la pantalla de inicio de sesión con soporte para autenticación estándar y botón integrado con el logo vectorial oficial de Google.
// 07/07/2026 v0.2 - Miguel Luna: Implementación de captura y registro de Expo Push Token en los flujos de login.
// 08/07/2026 v0.3 - Isabel: Fix - registro de push token envuelto en try/catch propio para que un fallo ahí (Expo Go / Web) no rompa el login exitoso.

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput, Image, Platform } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import * as Notifications from 'expo-notifications';
import Input from '../components/Input';
import Button from '../components/Button';
import { login, loginGoogle } from '../services/api';

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
  if (Platform.OS === 'web') {
    return null;
  }
  // Pide permiso al usuario
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return null;
  }

  // Obtiene el token único de este teléfono
  const token = (await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'unl-cloud-connect'
  })).data;
  console.log("Mi Expo Push Token es:", token);
  return token;
}

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

  const submit = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Por favor, ingresa tu correo y contraseña.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await login({ username: username.trim(), password });
      setLoading(false);

      if (res.id_rol !== 2) {
        Alert.alert('Acceso Denegado', 'Esta aplicación móvil es de uso exclusivo para participantes.');
        return;
      }

      const userProfile = {
        id_usuario: res.id_usuario,
        id_rol: res.id_rol,
        name: `${res.nombre} ${res.apellido}`,
        email: res.correo || username,
        token: res.access_token,
      };

      // Obtener token push al iniciar sesión.
      // Envuelto en su propio try/catch: si falla (normal en Expo Go o Web,
      // donde las notificaciones push remotas no están soportadas desde SDK 51),
      // NO debe bloquear ni cancelar el login que ya fue exitoso.
      try {
        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken) {
          // AQUÍ: Enviar este token a tu backend para guardarlo en la Base de Datos
          // await api.post('/auth/guardar-token', { expo_push_token: pushToken });
          console.log("Token a enviar al backend:", pushToken);
        }
      } catch (pushError) {
        console.warn('No se pudo registrar el push token (normal en Expo Go/Web):', pushError.message);
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

    // --- FALLBACK SIMULATION MODE (For Expo Go testing) ---
    if (!GoogleSignin) {
      setTimeout(() => {
        setLoading(false);
        const simulatedProfile = {
          id_usuario: 99,
          id_rol: 2,
          name: 'Miguel Luna (Simulado)',
          email: 'migue.luna@unl.edu.ec',
          token: 'SIMULATED_JWT_TOKEN',
        };
        Alert.alert(
          'Simulador Google Auth',
          'Estás corriendo en Expo Go (sin módulos nativos). Iniciando sesión en modo de simulación.',
          [{ text: 'Entrar', onPress: () => navigation.replace('Participant', { user: simulatedProfile }) }]
        );
      }, 1000);
      return;
    }

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
        Alert.alert('Acceso Denegado', 'Esta aplicación móvil es de uso exclusivo para participantes.');
        return;
      }

      const userProfile = {
        id_usuario: res.id_usuario,
        id_rol: res.id_rol,
        name: `${res.nombre} ${res.apellido}`,
        email: res.correo,
        token: res.access_token,
      };

      // Obtener token push al iniciar sesión con Google.
      // Envuelto en su propio try/catch por la misma razón que en submit().
      try {
        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken) {
          // AQUÍ: Enviar este token a tu backend
          // await api.post('/auth/guardar-token', { expo_push_token: pushToken });
          console.log("Token a enviar al backend:", pushToken);
        }
      } catch (pushError) {
        console.warn('No se pudo registrar el push token (normal en Expo Go/Web):', pushError.message);
      }

      navigation.replace('Participant', { user: userProfile });
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
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ height: 40, width: 200, marginBottom: 8 }}>
          <Image source={require('../img/logo.png')} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
        </View>
        <Text style={styles.subtitle}>Accede con tu correo institucional</Text>
      </View>

      <View style={styles.card}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Input
          label="Correo institucional"
          value={username}
          onChangeText={setUsername}
          placeholder="usuario.apellido@unl.edu.ec"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.passwordToggle}
            >
              {showPassword ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Recover')} style={styles.forgotButton}>
          <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#0F766E" style={styles.loader} />
        ) : (
          <View style={styles.buttonContainer}>
            <Button onPress={submit}>Iniciar sesión</Button>

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
              <Text style={styles.registerLinkText}>¿No tienes cuenta? Regístrate aquí</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F766E',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#6B7280',
    marginTop: 6,
    fontSize: 14,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
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
    marginTop: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    paddingHorizontal: 10,
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  registerLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  registerLinkText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 6,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderColor: '#E6EDF8',
    borderWidth: 1,
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    color: '#1F2937',
    fontSize: 14,
  },
  passwordToggle: {
    padding: 12,
  },
  googleButton: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E6EDF8',
    marginTop: 10,
  },
  googleButtonText: {
    color: '#0F172A',
    fontWeight: '600',
    fontSize: 14,
  },
});