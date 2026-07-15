// Autor: David Guamán
// Fecha: 27/06/2026
// Version: 0.1
// Historial:
// 27/06/2026 v0.1 - David Guamán: Implementación del flujo seguro de restablecimiento de contraseña mediante token automático recibido por Deep Linking y remoción de entradas manuales.

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  TouchableOpacity, 
  TextInput, 
  ScrollView 
} from 'react-native';
import { 
  Eye, 
  EyeOff, 
  Check, 
  X,
  Lock
} from 'lucide-react-native';
import Input from '../components/Input';
import Button from '../components/Button';
import { resetPassword } from '../services/api';

export default function ResetPasswordScreen({ route, navigation }) {
  const [clave, setClave] = useState('');
  const [confirm, setConfirm] = useState('');
  const [token, setToken] = useState(route.params?.token || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Sync token if it comes from a deep link URL parameter dynamically
  React.useEffect(() => {
    if (route.params?.token) {
      setToken(route.params.token);
    }
  }, [route.params?.token]);

  // Dynamic password criteria validation
  const passwordCriteria = {
    length: clave.length >= 8 && clave.length <= 12,
    hasUpper: /[A-Z]/.test(clave),
    hasLower: /[a-z]/.test(clave),
    hasDigit: /\d/.test(clave),
    hasSpecial: /[^a-zA-Z0-9]/.test(clave),
    noSpaces: clave.length > 0 && !/\s/.test(clave),
    noUsuario: clave.length > 0 && !clave.toLowerCase().includes('usuario')
  };

  const getPasswordStrength = (password) => {
    if (!password) return { level: 0, text: 'Ingresa una contraseña', color: '#9CA3AF' };
    let score = 0;
    if (passwordCriteria.length) score++;
    if (passwordCriteria.hasUpper) score++;
    if (passwordCriteria.hasLower) score++;
    if (passwordCriteria.hasDigit) score++;
    if (passwordCriteria.hasSpecial) score++;
    
    if (!passwordCriteria.noSpaces || !passwordCriteria.noUsuario) {
      return { level: 1, text: 'No permitida (Espacios / "usuario")', color: '#EF4444' };
    }

    if (score <= 2) return { level: score, text: 'Débil ❌', color: '#EF4444' };
    if (score <= 4) return { level: score, text: 'Aceptable ⚠️', color: '#F59E0B' };
    return { level: 5, text: 'Fuerte (Segura) ✓', color: '#10B981' };
  };

  const passwordStrength = getPasswordStrength(clave);

  const submit = async () => {
    if (!token) {
      setError('Token de recuperación no válido o ausente.');
      return;
    }

    if (!clave.trim() || !confirm.trim()) {
      setError('Por favor, complete todos los campos.');
      return;
    }

    if (clave !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    // Validate password constraints
    if (!passwordCriteria.length) {
      setError('La contraseña debe tener entre 8 y 12 caracteres.');
      return;
    }
    if (!passwordCriteria.noSpaces) {
      setError('La contraseña no puede contener espacios.');
      return;
    }
    if (!passwordCriteria.hasUpper) {
      setError('La contraseña debe contener al menos una letra mayúscula.');
      return;
    }
    if (!passwordCriteria.hasLower) {
      setError('La contraseña debe contener al menos una letra minúscula.');
      return;
    }
    if (!passwordCriteria.hasDigit) {
      setError('La contraseña debe contener al menos un número.');
      return;
    }
    if (!passwordCriteria.hasSpecial) {
      setError('La contraseña debe contener al menos un carácter especial.');
      return;
    }
    if (!passwordCriteria.noUsuario) {
      setError("La contraseña no puede contener la palabra 'usuario'.");
      return;
    }

    setError('');
    setLoading(true);

    try {
      await resetPassword({ token: token.trim(), clave: clave.trim() });
      setLoading(false);
      Alert.alert(
        'Contraseña Actualizada',
        'Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión con tu nueva contraseña.',
        [{ text: 'Ir al Login', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err) {
      setLoading(false);
      let msg = 'Error al restablecer la contraseña. El token puede ser inválido o haber expirado.';
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        msg = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        msg = detail.map(d => {
          let m = d.msg || 'Error de validación';
          if (m.startsWith('Value error, ')) {
            m = m.substring('Value error, '.length);
          }
          return m;
        }).join('\n');
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      Alert.alert('Error', msg);
    }
  };

  // If token is missing, request the user to open the email link
  if (!token) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Lock size={40} color="#0F766E" />
          </View>
          <Text style={styles.title}>Enlace Requerido</Text>
          <Text style={styles.subtitle}>
            Para cambiar tu contraseña, por favor revisa tu correo institucional y abre el enlace de recuperación directamente en tu celular.
          </Text>
          <Button onPress={() => navigation.navigate('Login')}>
            Volver al inicio de sesión
          </Button>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Cambiar Contraseña</Text>
        <Text style={styles.subtitle}>Introduce tu nueva contraseña de acceso</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Nueva Contraseña */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nueva contraseña (8 a 12 caracteres)</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              value={clave}
              onChangeText={setClave}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              maxLength={12}
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              style={styles.passwordToggle}
            >
              {showPassword ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
            </TouchableOpacity>
          </View>

          {/* Strength Bars */}
          {clave.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBarsRow}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <View 
                    key={i} 
                    style={[
                      styles.strengthBar, 
                      i <= passwordStrength.level 
                        ? { backgroundColor: passwordStrength.color } 
                        : { backgroundColor: '#E5E7EB' }
                    ]} 
                  />
                ))}
              </View>
              <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                {passwordStrength.text}
              </Text>
            </View>
          )}

          {/* Password Criteria Checklist */}
          <View style={styles.rulesContainer}>
            {[
              { key: 'length', text: 'Entre 8 y 12 caracteres' },
              { key: 'hasUpper', text: 'Al menos una mayúscula' },
              { key: 'hasLower', text: 'Al menos una minúscula' },
              { key: 'hasDigit', text: 'Al menos un número' },
              { key: 'hasSpecial', text: 'Al menos un carácter especial (ej. !@#$)' },
              { key: 'noSpaces', text: 'Sin espacios vacíos' },
              { key: 'noUsuario', text: 'No debe contener la palabra "usuario"' }
            ].map((rule) => {
              const satisfied = passwordCriteria[rule.key];
              return (
                <View key={rule.key} style={styles.ruleRow}>
                  {satisfied ? (
                    <View style={[styles.ruleIndicator, styles.indicatorChecked]}>
                      <Check size={10} color="#fff" />
                    </View>
                  ) : (
                    <View style={[styles.ruleIndicator, styles.indicatorUnchecked]}>
                      <X size={10} color="#9CA3AF" />
                    </View>
                  )}
                  <Text style={[styles.ruleText, satisfied && styles.ruleTextChecked]}>
                    {rule.text}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Confirmar Contraseña */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirmar nueva contraseña</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="••••••••"
              secureTextEntry={!showConfirmPassword}
              maxLength={12}
            />
            <TouchableOpacity 
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.passwordToggle}
            >
              {showConfirmPassword ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#0F766E" style={styles.loader} />
        ) : (
          <View style={styles.buttonContainer}>
            <Button onPress={submit}>Actualizar contraseña</Button>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')} 
              style={styles.backLink}
            >
              <Text style={styles.backLinkText}>Volver al inicio de sesión</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
    lineHeight: 18,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginVertical: 10,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderColor: '#E5E7EB',
    borderWidth: 1,
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
  strengthContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  strengthBarsRow: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
    marginRight: 10,
  },
  strengthBar: {
    height: 4,
    flex: 1,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rulesContainer: {
    marginTop: 10,
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  ruleIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorChecked: {
    backgroundColor: '#10B981',
  },
  indicatorUnchecked: {
    backgroundColor: '#E5E7EB',
  },
  ruleText: {
    fontSize: 11,
    color: '#6B7280',
  },
  ruleTextChecked: {
    color: '#1F2937',
    textDecorationLine: 'line-through',
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
