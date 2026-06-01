import React, {useState} from 'react'
import { View, Text } from 'react-native'
import Input from '../components/Input'
import Button from '../components/Button'
import { sendRecovery } from '../services/api'

export default function Recover({navigation}){
  const [email,setEmail] = useState('')

  const submit = async ()=>{
    try{ await sendRecovery({correo:email}); navigation.navigate('ResetPassword') }catch(err){ console.error(err) }
  }

  return (
    <View style={{flex:1, padding:20, backgroundColor:'#F9FAFB', justifyContent:'center'}}>
      <View style={{backgroundColor:'#fff', padding:16, borderRadius:12}}>
        <Text style={{fontSize:20, fontWeight:'700', color:'#0F172A', marginBottom:8}}>Recuperar contraseña</Text>
        <Input label="Correo institucional" value={email} onChangeText={setEmail} placeholder="usuario@unl.edu.ar" />
        <View style={{marginTop:12}}>
          <Button onPress={submit}>Enviar enlace</Button>
        </View>
      </View>
    </View>
  )
}
