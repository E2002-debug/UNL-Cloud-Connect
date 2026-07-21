// Autor: David Guamán
// Fecha: 27/06/2026
// Version: 0.1
// Historial:
// 27/06/2026 v0.1 - David Guamán: Implementación del flujo de solicitud de recuperación de contraseña y redirección al Login tras el envío del correo de restablecimiento.

import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import Input from '../components/Input';
import Button from '../components/Button';
import { sendRecovery } from '../services/api';

export default function RecoverScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!email.trim()) {
      setError('Por favor, ingresa tu correo institucional.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await sendRecovery({ correo: email.trim().toLowerCase() });
      setLoading(false);
      Alert.alert(
        'Solicitud Enviada',
        'Se ha enviado un correo con las instrucciones para restablecer tu contraseña. Por favor, abre el enlace desde tu celular.',
        [{ text: 'Entendido', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.detail || 'Error al solicitar la recuperación. Verifica tu correo.';
      setError(msg);
      Alert.alert('Error', msg);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Recuperar Contraseña</Text>
        <Text style={styles.subtitle}>Te enviaremos un token temporal a tu correo institucional</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Input 
          label="Correo institucional" 
          value={email} 
          onChangeText={setEmail} 
          placeholder="usuario.apellido@unl.edu.ec" 
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {loading ? (
          <ActivityIndicator size="large" color="#0F766E" style={styles.loader} />
        ) : (
          <View style={styles.buttonContainer}>
            <Button onPress={submit}>Recuperar</Button>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')} 
              style={styles.backLink}
            >
              <Text style={styles.backLinkText}>Volver al inicio de sesión</Text>
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
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F766E',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
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
  loader: {
    marginVertical: 12,
  },
  buttonContainer: {
    marginTop: 12,
  },
  backLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  backLinkText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '500',
  },
});
