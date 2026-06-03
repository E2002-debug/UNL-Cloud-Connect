import React, {useState} from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import Input from '../components/Input'
import Button from '../components/Button'
import { login, loginGoogle } from '../services/api'

export default function Login({navigation}){
  const [username,setUsername] = useState('')
  const [password,setPassword] = useState('')

  const submit = async () =>{
    try{ await login({username,password}); navigation.navigate('Register') }catch(err){ console.error(err) }
  }

  return (
    <View style={{flex:1, padding:20, backgroundColor:'#F9FAFB', justifyContent:'center'}}>
      <View style={{marginBottom:20}}>
        <Text style={{fontSize:24,fontWeight:'700', color:'#0F172A'}}>UNL-Cloud-Connect</Text>
        <Text style={{color:'#6B7280', marginTop:6}}>Accede con tu correo institucional</Text>
      </View>

      <View style={{backgroundColor:'#fff', padding:16, borderRadius:12, shadowColor:'#0F172A', shadowOpacity:0.06, elevation:4}}>
        <Input label="Correo institucional" value={username} onChangeText={setUsername} placeholder="usuario@unl.edu.ar" />
        <Input label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity onPress={()=>navigation.navigate('Recover')}>
          <Text style={{color:'#2563EB', textAlign:'right'}}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        <View style={{marginTop:12}}>
          <Button onPress={submit}>Iniciar sesión</Button>
        </View>

        <View style={{marginTop:8}}>
          <Button variant="outline" onPress={()=>loginGoogle({token:'GOOGLE_OAUTH_TOKEN'})}>Iniciar sesión con Google</Button>
        </View>
      </View>
    </View>
  )
}
