import React, {useState,useEffect} from 'react'
import { View, Text, Alert } from 'react-native'
import Input from '../components/Input'
import Button from '../components/Button'
import { googleRegister, registroHibrido } from '../services/api'

export default function GoogleHybrid({route,navigation}){
  const [form,setForm] = useState({nombre:'', apellido:'', correo:'', clave:'', fecha_nacimiento:'', id_rol: 2})
  const [readOnly,setReadOnly] = useState(false)

  useEffect(()=>{
    // Assume route.params has google fields
    const p = route?.params || {}
    if(p.correo){ setForm(f=>({...f, nombre:p.nombre || '', apellido:p.apellido || '', correo:p.correo})); setReadOnly(true) }
  },[])

  const submit = async ()=>{
    try{ 
      await registroHibrido({ ...form, id_rol: 2 }); 
      Alert.alert('Registro Exitoso', 'Registro híbrido completado. Ya puedes iniciar sesión.');
      navigation.navigate('Login') 
    }catch(err){ 
      console.error(err);
      let msg = 'No se pudo completar el registro híbrido.';
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
      Alert.alert('Error de Registro', msg);
    }
  }

  return (
    <View style={{flex:1, padding:20, backgroundColor:'#F9FAFB', justifyContent:'center'}}>
      <View style={{backgroundColor:'#fff', padding:16, borderRadius:12}}>
        <Text style={{fontSize:20, fontWeight:'700', color:'#0F172A', marginBottom:8}}>Registro híbrido</Text>
        <Input label="Nombre" value={form.nombre} onChangeText={(v)=>setForm({...form,nombre:v})} editable={!readOnly} />
        <Input label="Apellido" value={form.apellido} onChangeText={(v)=>setForm({...form,apellido:v})} editable={!readOnly} />
        <Input label="Correo" value={form.correo} onChangeText={(v)=>setForm({...form,correo:v})} editable={!readOnly} />
        <Input label="Clave" value={form.clave} onChangeText={(v)=>setForm({...form,clave:v})} secureTextEntry />
        <Input label="Fecha de nacimiento" value={form.fecha_nacimiento} onChangeText={(v)=>setForm({...form,fecha_nacimiento:v})} />

        <View style={{marginTop:12}}>
          <Button onPress={submit}>Completar registro</Button>
        </View>
      </View>
    </View>
  )
}
