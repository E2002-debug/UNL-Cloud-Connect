import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Alert, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  Pressable 
} from 'react-native';
import { 
  Calendar as CalendarIcon, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react-native';
import Button from '../components/Button';
import { register } from '../services/api';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    clave: '',
    fecha_nacimiento: '',
    id_rol: 2,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Date Picker States
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [viewMode, setViewMode] = useState('days'); // 'days' | 'years'
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date(2000, 0, 1));
  const [tempSelectedDate, setTempSelectedDate] = useState(null);

  // Dynamic password criteria validation
  const clave = form.clave;
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
    
    // Spaces or word "usuario" voids strength
    if (!passwordCriteria.noSpaces || !passwordCriteria.noUsuario) {
      return { level: 1, text: 'No permitida (Espacios / "usuario")', color: '#EF4444' };
    }

    if (score <= 2) return { level: score, text: 'Débil ❌', color: '#EF4444' };
    if (score <= 4) return { level: score, text: 'Aceptable ⚠️', color: '#F59E0B' };
    return { level: 5, text: 'Fuerte (Segura) ✓', color: '#10B981' };
  };

  const passwordStrength = getPasswordStrength(clave);

  // Calendar setup
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 60; // 1966
  const maxYear = currentYear - 17; // 2009

  const openDatePicker = () => {
    let initialDate = new Date(2000, 0, 1);
    if (form.fecha_nacimiento) {
      const parsed = new Date(form.fecha_nacimiento);
      if (!isNaN(parsed.getTime())) {
        initialDate = parsed;
      }
    }
    setCurrentCalendarDate(initialDate);
    setTempSelectedDate(form.fecha_nacimiento ? new Date(form.fecha_nacimiento) : null);
    setViewMode('days');
    setShowDatePicker(true);
  };

  const handleMonthChange = (direction) => {
    const newDate = new Date(currentCalendarDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    
    // Prevent months navigation going out of age bounds
    const newYear = newDate.getFullYear();
    if (newYear >= minYear && newYear <= maxYear) {
      setCurrentCalendarDate(newDate);
    }
  };

  const handleYearSelect = (selectedYear) => {
    const newDate = new Date(currentCalendarDate);
    newDate.setFullYear(selectedYear);
    setCurrentCalendarDate(newDate);
    setViewMode('days');
  };

  const handleConfirmDate = () => {
    if (tempSelectedDate) {
      const yyyy = tempSelectedDate.getFullYear();
      const mm = String(tempSelectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(tempSelectedDate.getDate()).padStart(2, '0');
      setForm({ ...form, fecha_nacimiento: `${yyyy}-${mm}-${dd}` });
      setError('');
    }
    setShowDatePicker(false);
  };

  const submit = async () => {
    // 1. Basic validation
    if (!form.nombre.trim() || !form.apellido.trim() || !form.correo.trim() || !form.clave.trim()) {
      setError('Por favor, rellene todos los campos obligatorios.');
      return;
    }
    
    // 2. Validate name/surname
    if (/\d/.test(form.nombre) || /\d/.test(form.apellido)) {
      setError('El nombre y apellido no pueden contener números.');
      return;
    }

    // 3. Validate email format
    const emailLower = form.correo.trim().toLowerCase();
    if (!emailLower.endsWith('@unl.edu.ec')) {
      setError('El correo debe pertenecer al dominio institucional @unl.edu.ec');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9_.-]+\.[a-zA-Z0-9_.-]+@unl\.edu\.ec$/;
    if (!emailRegex.test(emailLower)) {
      setError('El correo debe tener el formato nombre.apellido@unl.edu.ec');
      return;
    }

    // 4. Validate age limits (17 - 60 years)
    if (!form.fecha_nacimiento) {
      setError('La fecha de nacimiento es obligatoria.');
      return;
    }
    const fechaNac = new Date(form.fecha_nacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mesDiff = hoy.getMonth() - fechaNac.getMonth();
    if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }
    if (edad < 17 || edad > 60) {
      setError('Debes tener entre 17 y 60 años para crear una cuenta.');
      return;
    }

    // 5. Validate password constraints (strict front-end checks matching web)
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
      const payload = {
        ...form,
        id_rol: 2,
        correo: emailLower,
        fecha_nacimiento: form.fecha_nacimiento,
      };

      await register(payload);
      setLoading(false);
      Alert.alert(
        'Verificación Pendiente', 
        'Tu solicitud de registro ha sido recibida. Ten en cuenta que tu cuenta NO se creará en la base de datos hasta que la verifiques.\n\nPor favor, revisa tu correo institucional para encontrar el enlace de activación.',
        [{ text: 'Entendido, ir al Login', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err) {
      setLoading(false);
      let msg = 'Error al registrarse. Intente más tarde.';
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
      Alert.alert('Error de Registro', msg);
    }
  };

  // Render calendar days grid helper
  const renderCalendarDays = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ id: `empty-${i}`, val: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ id: `day-${d}`, val: d });
    }

    return (
      <View style={styles.daysGrid}>
        {days.map((item) => {
          if (item.val === null) {
            return <View key={item.id} style={styles.dayCellEmpty} />;
          }

          const isSelected = tempSelectedDate && 
                             tempSelectedDate.getDate() === item.val &&
                             tempSelectedDate.getMonth() === month &&
                             tempSelectedDate.getFullYear() === year;

          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.dayCell, isSelected && styles.dayCellSelected]}
              onPress={() => setTempSelectedDate(new Date(year, month, item.val))}
            >
              <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                {item.val}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // Render calendar years list helper
  const renderCalendarYears = () => {
    const years = [];
    for (let y = maxYear; y >= minYear; y--) {
      years.push(y);
    }

    return (
      <ScrollView contentContainerStyle={styles.yearsGrid}>
        {years.map((y) => {
          const isSelected = currentCalendarDate.getFullYear() === y;
          return (
            <TouchableOpacity
              key={y}
              style={[styles.yearItem, isSelected && styles.yearItemSelected]}
              onPress={() => handleYearSelect(y)}
            >
              <Text style={[styles.yearItemText, isSelected && styles.yearItemTextSelected]}>
                {y}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Crear Cuenta UNL</Text>
        <Text style={styles.subtitle}>Ingresa tus datos institucionales</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Nombre */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre *</Text>
          <TextInput
            style={styles.textInput}
            value={form.nombre}
            onChangeText={(v) => setForm({ ...form, nombre: v })}
            placeholder="Ej: Juan"
          />
        </View>
        
        {/* Apellido */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Apellido *</Text>
          <TextInput
            style={styles.textInput}
            value={form.apellido}
            onChangeText={(v) => setForm({ ...form, apellido: v })}
            placeholder="Ej: Pérez"
          />
        </View>
        
        {/* Correo */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Correo institucional *</Text>
          <TextInput
            style={styles.textInput}
            value={form.correo}
            onChangeText={(v) => setForm({ ...form, correo: v })}
            placeholder="juan.perez@unl.edu.ec"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        
        {/* Contraseña */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contraseña *</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              value={form.clave}
              onChangeText={(v) => setForm({ ...form, clave: v })}
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
          
          {/* Password strength meter */}
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

          {/* Password dynamic rules list */}
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
        
        {/* Fecha Nacimiento */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Fecha de nacimiento *</Text>
          <TouchableOpacity 
            style={styles.dateSelectorButton} 
            onPress={openDatePicker}
            activeOpacity={0.8}
          >
            <Text style={[styles.dateSelectorText, !form.fecha_nacimiento && styles.dateSelectorTextPlaceholder]}>
              {form.fecha_nacimiento ? form.fecha_nacimiento : 'Seleccionar fecha (17 a 60 años)'}
            </Text>
            <CalendarIcon size={18} color="#0F766E" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#0F766E" style={styles.loader} />
        ) : (
          <View style={styles.buttonContainer}>
            <Button onPress={submit}>Crear cuenta</Button>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')} 
              style={styles.loginLink}
            >
              <Text style={styles.loginLinkText}>¿Ya tienes cuenta? Inicia sesión aquí</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* CUSTOM CALENDAR MODAL */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowDatePicker(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Selecciona tu Fecha de Nacimiento</Text>
            <Text style={styles.modalSubtitle}>Debes tener entre 17 y 60 años para registrarte</Text>

            {/* Calendar Controls */}
            <View style={styles.calendarControls}>
              {viewMode === 'days' ? (
                <>
                  <TouchableOpacity 
                    onPress={() => handleMonthChange('prev')}
                    style={styles.navBtn}
                  >
                    <ChevronLeft size={20} color="#0F766E" />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => setViewMode('years')}
                    style={styles.headerDateLabel}
                  >
                    <Text style={styles.headerDateLabelText}>
                      {MONTHS[currentCalendarDate.getMonth()]} {currentCalendarDate.getFullYear()} ▾
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => handleMonthChange('next')}
                    style={styles.navBtn}
                  >
                    <ChevronRight size={20} color="#0F766E" />
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.yearSelectHeader}>
                  <Text style={styles.yearSelectHeaderText}>Selecciona tu Año de Nacimiento</Text>
                  <TouchableOpacity 
                    onPress={() => setViewMode('days')} 
                    style={styles.backToDaysBtn}
                  >
                    <Text style={styles.backToDaysBtnText}>Volver</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Date Grid or Years List */}
            <View style={styles.gridContainer}>
              {viewMode === 'days' ? (
                <>
                  {/* Weekday labels */}
                  <View style={styles.weekdayRow}>
                    {WEEKDAYS.map((day) => (
                      <Text key={day} style={styles.weekdayText}>{day}</Text>
                    ))}
                  </View>
                  {/* Days */}
                  {renderCalendarDays()}
                </>
              ) : (
                renderCalendarYears()
              )}
            </View>

            {/* Footer Buttons */}
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalCancelBtn}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalConfirmBtn, !tempSelectedDate && styles.modalConfirmBtnDisabled]}
                onPress={handleConfirmDate}
                disabled={!tempSelectedDate}
              >
                <Text style={styles.modalConfirmBtnText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginVertical: 10,
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
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderColor: '#E5E7EB',
    borderWidth: 1,
    color: '#1F2937',
    fontSize: 14,
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
  dateSelectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderColor: '#E5E7EB',
    borderWidth: 1,
  },
  dateSelectorText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  dateSelectorTextPlaceholder: {
    color: '#9CA3AF',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginBottom: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  loader: {
    marginVertical: 12,
  },
  buttonContainer: {
    marginTop: 12,
  },
  loginLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  loginLinkText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '500',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  calendarControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
    padding: 6,
    borderRadius: 10,
  },
  navBtn: {
    padding: 6,
  },
  headerDateLabel: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  headerDateLabelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F766E',
  },
  yearSelectHeader: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  yearSelectHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  backToDaysBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  backToDaysBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  gridContainer: {
    minHeight: 240,
    justifyContent: 'center',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 6,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  dayCellEmpty: {
    width: '14.28%',
    aspectRatio: 1,
  },
  dayCellSelected: {
    backgroundColor: '#0F766E',
    borderRadius: 100,
  },
  dayText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: '800',
  },
  yearsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  yearItem: {
    width: '28%',
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginBottom: 4,
  },
  yearItemSelected: {
    backgroundColor: '#0F766E',
  },
  yearItemText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  yearItemTextSelected: {
    color: '#fff',
    fontWeight: '800',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalCancelBtnText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
  },
  modalConfirmBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalConfirmBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  modalConfirmBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
