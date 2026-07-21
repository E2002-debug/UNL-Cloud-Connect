import React from 'react'
import { TextInput, Text, View } from 'react-native'

export default function Input({label, value, onChangeText, placeholder, secureTextEntry=false, editable=true}){
  return (
    <View style={{marginBottom:12}}>
      {label && <Text style={{marginBottom:6,color:'#0F172A'}}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        editable={editable}
        style={{backgroundColor:'#fff', padding:12, borderRadius:12, borderColor:'#E6EDF8', borderWidth:1}}
      />
    </View>
  )
}
