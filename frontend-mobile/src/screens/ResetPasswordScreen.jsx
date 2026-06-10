import React, {useState} from 'react'
import { View, Text } from 'react-native'
import Input from '../components/Input'
import Button from '../components/Button'
import { resetPassword } from '../services/api'

export default function ResetPassword({navigation}){
  const [clave,setClave] = useState('')
  const [confirm,setConfirm] = useState('')
  const [token,setToken] = useState('')

  const submit = async ()=>{
    if(clave !== confirm) return
    try{ await resetPassword({token, clave}); navigation.navigate('Login') }catch(err){ console.error(err) }
  }

  return (
    <View style={{flex:1, padding:20, backgroundColor:'#F9FAFB', justifyContent:'center'}}>
      <View style={{backgroundColor:'#fff', padding:16, borderRadius:12}}>
        <Text style={{fontSize:20, fontWeight:'700', color:'#0F172A', marginBottom:8}}>Cambiar contraseña</Text>
        <Input label="Nueva contraseña" value={clave} onChangeText={setClave} secureTextEntry />
        <Input label="Confirmar contraseña" value={confirm} onChangeText={setConfirm} secureTextEntry />
        <Input label="Token" value={token} onChangeText={setToken} placeholder="Código recibido" />

        <View style={{marginTop:12}}>
          <Button onPress={submit}>Actualizar contraseña</Button>
        </View>
      </View>
    </View>
  )
}
