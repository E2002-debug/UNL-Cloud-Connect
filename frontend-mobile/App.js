// Autor: David Guamán
// Fecha: 27/06/2026
// Version: 0.1
// Historial:
// 27/06/2026 v0.1 - David Guamán: Configuración del contenedor de navegación principal y del esquema de Deep Linking para la ruta de restablecimiento de contraseña.

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from './src/screens/LoginScreen';
import Register from './src/screens/RegisterScreen';
import GoogleHybrid from './src/screens/GoogleHybridScreen';
import Recover from './src/screens/RecoverScreen';
import ResetPassword from './src/screens/ResetPasswordScreen';
import Participant from './src/screens/ParticipantScreen';
import EventDetail from './src/screens/EventDetailScreen';

const Stack = createNativeStackNavigator();

const linking = {
  // ==========================================
  // ESQUEMAS PERMITIDOS PARA EL ENLACE PROFUNDO
  // ==========================================
  prefixes: [
    'unlconnect://', // Esquema para producción (compilado como standalone APK)
    'exp://',        // Esquema para desarrollo local con Expo Go
  ],
  config: {
    screens: {
      // Asocia la ruta 'reset-password' a la pantalla ResetPassword
      ResetPassword: 'reset-password',
    },
  },
};

export default function App() {
  return (
    <SafeAreaProvider style={styles.container}>
      <View style={styles.container}>
        <NavigationContainer linking={linking}>
          <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Register" component={Register} />
            <Stack.Screen name="GoogleHybrid" component={GoogleHybrid} />
            <Stack.Screen name="Recover" component={Recover} />
            <Stack.Screen name="ResetPassword" component={ResetPassword} />
            <Stack.Screen name="Participant" component={Participant} />
            <Stack.Screen name="EventDetail" component={EventDetail} />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
});
